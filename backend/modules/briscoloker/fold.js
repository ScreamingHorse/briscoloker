
const debug = require("debug")('briscoloker:briscolokerHelpers:fold');
const mongoDbHelpers = require('../mongoDbHelpers');
const ObjectId = require("mongodb").ObjectID;
const getMyGameBro = require('./getMyGameBro');

module.exports = async (token, mongoClient) => {
  debug("token",token);
  let game = await getMyGameBro(token, mongoClient);
  let hero = game.players.filter(P => {
    return P.id === token
  })[0];
  let villan = game.players.filter(P => {
    return P.id !== token
  })[0];
  let currentHand = game.currentHand;

  game.logs.push({
    time: new Date().getTime(),
    log: `${hero.name} folded`,
  });

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