const debug = require("debug")('briscoloker:briscolokerHelpers');
const mongoDbHelpers = require('./mongoDbHelpers');
const ObjectId = require("mongodb").ObjectID;

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

const getMyGameByName = async (gameName, mongoClient) => {
  try {
    const gamesCollection = mongoClient.collection('games');
    const searchObject = {"name": gameName};
    //we are looking for the specifc game with the specific name
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

const startTheGameWillYa = async (roomName, mongoClient) => {
  try {
    let game = await getMyGameByName(roomName, mongoClient);
    debug("game object", game);
    game.discardedCards = [];
    //update the players
    game.players[0].cardsCaptured = [];
    game.players[0].hand = [];
    game.players[0].score = 0;
    game.players[0].chips = 100;
    game.players[0].roundLeader = false;
    game.players[0].initiative = false;
    game.players[0].currentHand = {
      bets : 0,
      playedCard : null,
    };
    game.players[1].cardsCaptured = [];
    game.players[1].hand = [];
    game.players[1].score = 0;
    game.players[1].chips = 100;
    game.players[1].roundLeader = false;
    game.players[1].initiative = false;
    game.players[1].currentHand = {
      bets : 0,
      playedCard : null,
    };
    //deck
    game.deck = [];
    //Everything is reset
    //Step 1: Build the deck
    //cycling the suits (0->3)
    for (var s = 0; s <= 3; s++) {
      //values (1 -> 10)
      for (var v = 1; v <= 10; v++) {
        game.deck.push({
          value: v,
          suit: s,
        });
      }
    };
    //step 2: Shuffle the deck
    game.deck.sort(()=> Math.random()-0.5);
    //step 3 decide who is the first to play
    game.roundLeader = [0,1].sort(()=>Math.random()-0.5)[0];
    game.players[game.roundLeader].roundLeader = true;
    game.players[game.roundLeader].initiative = true;
    //step 4 pick the cards for the players
    //I am picking one each.
    for (var ii=0; ii<3; ii++) {
      game.players[0].hand.push(game.deck.pop());
      game.players[1].hand.push(game.deck.pop());
    }
    //step 5 pick the Trump
    game.trumpCard = game.deck.pop();
    game.isStarted = true;
    //step 6 create the current hand object
    game.currentHand = {
        bettingRound: 0,
        isBettingPhase: true,
        isFolded: false,
        pot:0,
        winner : null,
    }
    const gamesCollection = mongoClient.collection('games');
    await mongoDbHelpers.updateOneByObjectId(gamesCollection,ObjectId(game._id),game);
    return true;
  } catch (e) {
    console.error("error creating the game", e);
    return false;
  }
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
      name : villan.name,
      score : villan.score,
      chips : villan.chips,
      roundLeader : villan.roundLeader,
      initiative : villan.initiative,
      cardsCaptured : villan.cardsCaptured,
      currentHand : villan.currentHand,
    },
    hero : hero,
    trumpCard : game.trumpCard,
    currentHand : game.currentHand,
    deck : {
      cardLeft : game.deck.length,
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
      console.log('gameState',gameState);
      client.emit('game_state',{result: gameState});
    }
  } catch (e) {
    console.error(e);
    throw e;
  }
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

  //1. need to check if the player has the money to bet
  if (hero.chips < bet) {
    //NOt enought money to 
    //1. Calculate the difference
    let overBet = bet - hero.chips;
    //2. size the bet to all the hero's money
    bet = hero.chips;
    //3. if the new bet covers what villan put into the pot
    if ((parseInt(hero.currentHand.bets) + bet) < parseInt(villan.currentHand.bets)) {
      //4.Hero is betting less then what villan did,
      //meaning that he is calling an all in
      villan.chips += overBet;
      //4.update the current bet of the hero
      villan.currentHand.villanBets -= bet;
      currentHand.pot -= overBet;
    }
  } else {
      //villan is without money, he is all in some how
      //if he put more money on the pot, need to match
      //I assume an overbet by the hero
      if (villan.chips === 0 && villan.currentHand.bets >= hero.currentHand.bets) {
        //need to resize the bet
        bet = villan.currentHand.bets - hero.currentHand.bets;
      }
  }
  //2. spend the money
  hero.chips -= bet;
  currentHand.pot += bet;
  hero.currentHand.bets +=bet;
  //3. switch the initiative
  hero.initiative = false;
  villan.initiative = true;
  //4. check if the betting round is over
  //   they played the same amount of chips / it's not the first check
  if (villan.currentHand.bets === hero.currentHand.bets && !(currentHand.bettingRound ===0)) {
    currentHand.isBettingPhase = false;
    //if the round ends, hero get the card initiave
  }
  //5. bump the betting round
  currentHand.bettingRound ++;
  //6. check if villan has still anything left
  //if not end the betting phase
  if (villan.chips === 0) {
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

  //1, get the card that I want to play
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

const resolveHand = (mongoClient) => {
  
  
}

module.exports = {
  getMyGameBro,
  getVillan,
  updateHero,
  startTheGameWillYa,
  formatOutput,
  betting,
  sendAllTheGameStates,
  playACard,
}
