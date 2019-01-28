const debug = require('debug')('briscoloker:briscolokerHelpers');
const mongoDbHelpers = require('./mongoDbHelpers');
const ObjectId = require('mongodb').ObjectID;
const resolveHand = require('./briscoloker/resolveHand');
const getMyGameByName = require('./briscoloker/getMyGameByName');
const startTheGameWillYa = require('./briscoloker/startTheGameWillYa');

const getMyGameBro = async (token, mongoClient) => {
  try {
    const gamesCollection = mongoClient.collection('games');
    const searchObject = {"players.id":{$in: [token]}};
    //we are looking for any game where one of the players is the token
    debug('searchObject', searchObject);
    let myGame = await mongoDbHelpers.getStuffFromMongo(gamesCollection,searchObject,{},1);
    if (myGame.length === 1) {
      return myGame[0];
    } else {
      return null;
    }
  } catch (e) {
    throw e
  }
}

const updateHero = async (token, mongoClient, stuffToUpdate)=> {
  try {
    const gamesCollection = mongoClient.collection('games');
    //1 get my game
    let game = await getMyGameBro(token, mongoClient);
    let hero = game.players.filter(P => {
      return P.id === token
    })[0];
    let allTheKeysToUpdate = Object.keys(stuffToUpdate);
    debug('allTheKeysToUpdate',allTheKeysToUpdate);
    for (var idx = 0; idx < allTheKeysToUpdate.length ; idx ++) {
      let key = allTheKeysToUpdate[idx]; 
      debug(`Updating ${key} with ${stuffToUpdate[key]}`);
      hero[key] = stuffToUpdate[key];
      await mongoDbHelpers.updateOneByObjectId(gamesCollection,ObjectId(game._id),game);
    }
  } catch (e) {
    throw e
  }
};

const getVillan = async (token, mongoClient) => {
  //1 get my game
  let game = await getMyGameBro(token, mongoClient);
  let villan = game.players.filter(P => {
    return P.id != token
  })[0];
  return villan
}

const formatOutput = async (token, mongoClient) => {
  let game = await getMyGameBro(token, mongoClient);
  let villan = game.players.filter(P => {
    return P.id !== token
  })[0];
  let hero = game.players.filter(P => {
    return P.id === token
  })[0];
  let gameState = {
    villan : {
      name : villan.name ? villan.name : '',
      score : villan.score ? villan.score : 0,
      chips : villan.chips ? villan.chips : 0,
      roundLeader : villan.roundLeader ? villan.roundLeader : false,
      initiative : villan.initiative ? villan.initiative : false,
      cardsCaptured : villan.cardsCaptured ? villan.cardsCaptured : [],
      currentHand : villan.currentHand ? villan.currentHand : [],
      cardsInHand : villan ? villan.hand ? villan.hand.length :0 : 0,
    },
    hero : hero,
    discardedCards : game ? game.discardedCards ? game.discardedCards.length : 0 : 0,
    trumpCard : game ? game.trumpCard : {},
    sideBet : game ? game.sideBet : 0,
    currentHand : game ? game.currentHand : [],
    deck : {
      cardLeft : game ? game.deck ? game.deck.length : 0 : 0,
    },
    gameState : {
      isTheRoundFinished : game.isTheRoundFinished,
      isTheGameFinished: game.isTheGameFinished,
      lastRoundWinner: game.lastRoundWinner,
      winnerOfTheWholeThing: game.winnerOfTheWholeThing,
      round: game.round,
    }
  }
  return gameState;
}

const sendAllTheGameStates = async (io, gameName, mongoClient) => {
  try {
    const clients = Object.keys(io.sockets.adapter.rooms[gameName].sockets);
    debug(clients, clients.length);
    for (let idx = 0; idx < clients.length; idx ++) {
      //debug("idx",idx);
      let client = io.sockets.connected[clients[idx]];
      let clientToken = client.token;
      debug(clientToken);
      let gameState = await formatOutput(clientToken, mongoClient);
      //console.log('gameState',gameState);
      client.emit('game_state',{result: gameState});
    }
  } catch (e) {
    console.error(e);
    throw e;
  }
}
const fold = async (token, mongoClient) => {
  debug("token",token);
  let game = await getMyGameBro(token, mongoClient);
  let hero = game.players.filter(P => {
    return P.id === token
  })[0];
  let villan = game.players.filter(P => {
    return P.id !== token
  })[0];
  let currentHand = game.currentHand;

  //1. mark the hand as folded
  currentHand.isFolded = true;
  currentHand.isBettingPhase = false;
  //2. give away initiative
  hero.initiative = false;
  villan.initiative = true;
  //3. villan win the hand
  currentHand.winner = villan.id;
  //4. save the state of the game into mongo
  const gamesCollection = mongoClient.collection('games');
  await mongoDbHelpers.updateOneByObjectId(gamesCollection,ObjectId(game._id),game);
}

const betting = async (token, mongoClient, bet) => {

  //get the game
  debug("token",token);
  debug("bet",bet);
  let game = await getMyGameBro(token, mongoClient);
  let hero = game.players.filter(P => {
    return P.id === token
  })[0];
  let villan = game.players.filter(P => {
    return P.id !== token
  })[0];
  let currentHand = game.currentHand;
  debug("hero.currentHand.bets", hero.currentHand.bets);
  debug("villan.currentHand.bets", villan.currentHand.bets);
  debug("hero.chips", hero.chips);
  debug("villan.chips", villan.chips);
  //1. need to check if the player has the money to bet
  if (hero.chips < bet) {
    //Not enought money to 
    bet = hero.chips;
  }
  let villanContribution = parseInt(villan.currentHand.bets);
  let heroContribution = parseInt(hero.currentHand.bets) + bet;

  if (villanContribution > heroContribution) {
    //villan still have more money on the pot.
    //hero is all in
    //villan need the difference back
    let difference = villanContribution - heroContribution;
    villan.chips += difference;
    //update the current bet of the villan
    villan.currentHand.villanBets -= bet;
    currentHand.pot -= difference;
  } else if (villanContribution < heroContribution) {
    //hero contribution  higher then villan contribution
    //if the villan is with 0 chips, he is all-in and 
    //need to resize hero bet
    if (villan.chips === 0) {
      //need to resize the bet
      let difference = heroContribution - villanContribution;
      det = difference;
    }
  }

  debug("Actual bet size", bet);
  //2. spend the money
  hero.chips -= bet;
  currentHand.pot += bet;
  hero.currentHand.bets +=bet;
  //3. switch the initiative
  hero.initiative = false;
  villan.initiative = true;
  //4. check if the betting round is over
  //   they played the same amount of chips / it's not the first check
  if (villan.currentHand.bets === hero.currentHand.bets && currentHand.bettingRound !==0) {
    currentHand.isBettingPhase = false;
    //if the round ends, hero get the card initiave
  }
  //5. bump the betting round
  currentHand.bettingRound ++;
  //6. check if villan has still anything left
  //if not end the betting phase
  if (villan.chips === 0 || hero.chips === 0) {
    currentHand.bettingPhase = false;
  }
  //7 save the state of the game into mongo
  const gamesCollection = mongoClient.collection('games');
  await mongoDbHelpers.updateOneByObjectId(gamesCollection,ObjectId(game._id),game);
}

const playACard = async (token, mongoClient, card) => {

  //get the game
  debug("token",token);
  debug("card", card);
  let game = await getMyGameBro(token, mongoClient);
  let hero = game.players.filter(P => {
    return P.id === token
  })[0];
  let villan = game.players.filter(P => {
    return P.id !== token
  })[0];
  let currentHand = game.currentHand;

  //1. get the card that I want to play
  let cardToPlay = hero.hand.filter(C => C.value === card.value && C.suit === card.suit)[0];
  hero.hand.splice(hero.hand.findIndex(C => C.value === card.value && C.suit === card.suit),1);
  if (currentHand.isFolded) {
    game.discardedCards.push(cardToPlay);
  } else {
    hero.currentHand.playedCard = cardToPlay;
  }

  //2. switch the initiative
  hero.initiative = false;
  villan.initiative = true;

  //3 save the state of the game into mongo
  const gamesCollection = mongoClient.collection('games');
  await mongoDbHelpers.updateOneByObjectId(gamesCollection,ObjectId(game._id),game);

  //4 return game
  return game;
};

module.exports = {
  getMyGameBro,
  getVillan,
  updateHero,
  startTheGameWillYa,
  formatOutput,
  betting,
  sendAllTheGameStates,
  playACard,
  resolveHand,
  fold,
}
