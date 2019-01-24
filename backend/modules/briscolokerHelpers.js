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

const startTheGameWillYa = async (token, mongoClient) => {
  let game = await getMyGameBro(token, mongoClient);
  game.board = {
    playedCards : {
      hero: null,
      villan: null,
    },
    discardedCards : []
  }
  //update the players
  game.players[0].cardsCaptured = [];
  game.players[0].hand = [];
  game.players[0].score = 0;
  game.players[0].chips = 100;
  game.players[0].roundLeader = false;
  game.players[0].initiative = false;
  game.players[1].cardsCaptured = [];
  game.players[1].hand = [];
  game.players[1].score = 0;
  game.players[1].chips = 100;
  game.players[1].roundLeader = false;
  game.players[1].initiative = false;
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
  const gamesCollection = mongoClient.collection('games');
  await mongoDbHelpers.updateOneByObjectId(gamesCollection,ObjectId(game._id),game);
  return game;
}

const formatOutput = async (token, game) => {
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
    },
    hero : hero,
    trumpCard : game.trumpCard,
    deck : {
      cardLeft : game.deck.length,
    }
  }
  return gameState;
}

module.exports = {
  getMyGameBro,
  getVillan,
  updateHero,
  startTheGameWillYa,
  formatOutput,
}
