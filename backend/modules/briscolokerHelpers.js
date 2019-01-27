const debug = require("debug")('briscoloker:briscolokerHelpers');
const mongoDbHelpers = require('./mongoDbHelpers');
const ObjectId = require("mongodb").ObjectID;
/**
 * array that contains the actual value of the cards
 * Map value:
 * Ace -> INDEX 0 -> VALUE 12
 * 2 -> 1 -> VALUE 2
 * 3 -> 2 -> 11
 * 4 to 10 are mapped as they are
 */
const valueMapper = [12,2,11,4,5,6,7,8,9,10];
/**
 * Array that contains the points for each face value of the cards
 * Map value:
 * Ace -> 11
 * 2 -> 0
 * 3 -> 10
 * 4 to 7 -> 0
 * 8 -> 2
 * 9 -> 3
 * 10 -> 4
 */
const scoreMapper = [11,0,10,0,0,0,0,2,3,4];

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
    //get the gaming round
    if (typeof game.round === 'undefined') game.round = 1;
    game.discardedCards = [];
    //update the players
    game.players.forEach(playerObject => {
      playerObject.cardsCaptured = [];
      playerObject.hand = [];
      playerObject.roundLeader = false;
      playerObject.initiative = false;
      playerObject.currentHand = {
        bets : 0,
        playedCard : null,
      };
      if (game.round === 1) {
        playerObject.score = 0;
        playerObject.chips = 100;
      }
    });
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
    //step 7 sideBet
    //sizing the sideBet
    game.sideBet = parseInt(10 * game.round);
    game.players.forEach(P => {
      if (P.chips <= game.sideBet) {
        game.sideBet = P.chips;
      }
    });
    game.players[0].chips -= game.sideBet;
    game.players[1].chips -= game.sideBet;

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
    discardedCards : game.discardedCards.length,
    trumpCard : game.trumpCard,
    sideBet : game.sideBet,
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

const resolveHand = async (gameName, mongoClient) => {
  let game = await getMyGameByName(gameName, mongoClient);
  
  let player1 = game.players[0];
  let player2 = game.players[1];
  let trumpCard = game.trumpCard;
  let currentHand = game.currentHand;
  let deck = game.deck;
  let isTheRoundFinished = false;
  let isTheGameFinished =false;
  let roundWinner = '';
  debug('player1',player1);
  debug('player2',player2);
  debug('trumpCard',trumpCard);
  debug('currentHand',currentHand);
  //get the 2 hands
  //the hand is not folded
  if (!currentHand.isFolded) {
    let heroCard = player1.currentHand.playedCard;
    let villanCard = player2.currentHand.playedCard;
    debug('heroCard',heroCard);
    debug('villanCard',villanCard);
    //check if any of the card is a Trump
    heroCard.isTrump = (heroCard.suit === trumpCard.suit);
    villanCard.isTrump = (villanCard.suit === trumpCard.suit);
    //check if no trump
    if (!heroCard.isTrump && !villanCard.isTrump) {
      //no one played a Trump card
      //check if the 2 cards have the same suit
      if (heroCard.suit === villanCard.suit) {
        //the cards are from the same suit
        //the higest wins
        if (valueMapper[heroCard.value-1] > valueMapper[villanCard.value-1]) {
          roundWinner = 'hero';
        } else {
          roundWinner = 'villan';
        }
      } else {
        //the cards are not from the same suit
        //the leader wins
        if (player1.roundLeader) {
          roundWinner = 'hero';
        } else {
          roundWinner = 'villan';
        }
      }
    } else if ((heroCard.isTrump && villanCard.isTrump)) {
      //2 trumps 
      //check the card with higher face value
      if (valueMapper[heroCard.value-1] > valueMapper[villanCard.value-1]) {
        roundWinner = 'hero';
      } else {
        roundWinner = 'villan';
      }
    } else {
      // 1 trumps
      if (heroCard.isTrump) {
        roundWinner = 'hero';
      } else {
        roundWinner = 'villan';
      }
    }
    //add the card to the captured card
    if(roundWinner === 'hero') {//player_1 index 0
      player1.cardsCaptured.push(heroCard);
      player1.cardsCaptured.push(villanCard);
      //adding the pot to the hero bank
      player1.chips += currentHand.pot;
      player1.roundLeader = true;
      player1.initiative = true;
      player2.roundLeader = false;
      player2.initiative = false;
    } else {//player_2 index 1
      player2.cardsCaptured.push(heroCard);
      player2.cardsCaptured.push(villanCard);
      //adding the pot to the villan account
      player2.chips += currentHand.pot;
      player2.roundLeader = true;
      player2.initiative = true;
      player1.roundLeader = false;
      player1.initiative = false;
    }
    //calculating the current score for the players
    game.players.forEach(P => {
      let score = 0;
      P.cardsCaptured.forEach(C => {
        score += scoreMapper[C.value -1]
      });
      P.score = score;
    });
  } else {
    //the hand is folded
    if (player1.id === currentHand.winner) {
      winner = 'hero';
      player1.chips += currentHand.pot;
    } else {
      winner = 'villan';
      player2.chips += currentHand.pot;
    }
    //winner = currentHand.winner;
  }
  //picking the new card
  if(roundWinner === 'hero') { //player_1
    //Pick a new card for each one Hero goes first);
    //Pick the cards only if there are cards!!
    if (deck.length > 0) {
      player1.hand.push(deck.pop());
      if (deck.length === 0) {
        //debugger;
        //no card left use trump
        player2.hand.push({value: trumpCard.value, suit: trumpCard.suit});
        //trumpCard = {};
      } else {
        player2.hand.push(deck.pop());
      }
    }
  } else {
    //Pick a new card for each one Villan goes first);
    //only if the deck is not empty, broooo!
    if (deck.length > 0) {
      player2.hand.push(deck.pop());
      if (deck.length === 0) {
        //no card left use trump
        player1.hand.push({value: trumpCard.value, suit: trumpCard.suit});
        //trumpCard = {};
      } else {
        player1.hand.push(deck.pop());
      }
    }
  }
  //check if the game is still on
  if ((player1.cardsCaptured.length + player1.cardsCaptured.length + game.discardedCards.length) === 40) {
    //debugger;
    isTheRoundFinished = true;
    //assign the sideBet
    if (player1.score === player2.score) {
      //it's a tie!!!!
      player1.chips += game.sideBet;
      player2.chips += game.sideBet;
      game.lastRoundWinner = 'This round was a tie!';
    } else if (player1.score > player2.score) {
      //player_1 won
      player1.chips += game.sideBet * 2;
      if (player2.chips === 0) {
        isTheGameFinished = true;
        game.gameWinner = player1;
      }
      game.lastRoundWinner = `The winner is ${player1.name}!`;
    } else {
      //player_2 won
      player2.chips += game.sideBet * 2;
      if (player1.chips === 0) {
        isTheGameFinished = true;
        game.gameWinner = player2;
      }
      game.lastRoundWinner = `The winner is ${player2.name}!`;
    }
  }
  //check if both of the player have money, if not the betting phase is skipped
  //debugger
  currentHand.isBettingPhase = true;
  console.log('currentHand.isBettingPhase',currentHand.isBettingPhase);
  if (player1.chips === 0 || player2.chips === 0) {
    currentHand.isBettingPhase = false;
  }
  currentHand.bettingRound = 0;
  currentHand.pot = 0;
  currentHand.winner = null;
  currentHand.isFolded = false;

  game.players.forEach(P => {
    //reset the bets
    P.currentHand.bets = 0;
    //reset the played cards
    P.currentHand.playedCard = null;
  });

  //3 save the state of the game into mongo
  const gamesCollection = mongoClient.collection('games');
  await mongoDbHelpers.updateOneByObjectId(gamesCollection,ObjectId(game._id),game);
  
  return [isTheRoundFinished,isTheGameFinished];
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
  resolveHand,
  fold,
}
