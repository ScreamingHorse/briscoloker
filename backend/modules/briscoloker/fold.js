
const debug = require('debug')('briscoloker:briscolokerHelpers:fold');
const ObjectId = require('mongodb').ObjectID;
const mongoDbHelpers = require('../mongoDbHelpers');
const getMyGameBro = require('./getMyGameBro');

module.exports = async (token, mongoClient) => {
  debug('token', token);
  const game = await getMyGameBro(token, mongoClient);
  const hero = game.players.filter(P => P.id === token)[0];
  const villan = game.players.filter(P => P.id !== token)[0];
  const currentHand = game.currentHand;

  game.logs.push({
    time: new Date().getTime(),
    log: `${hero.name} folded`,
  });

  // 1. mark the hand as folded
  currentHand.isFolded = true;
  currentHand.isBettingPhase = false;
  // 2. give away initiative
  hero.initiative = false;
  villan.initiative = true;
  // 3. villan win the hand
  currentHand.winner = villan.id;
  // 4. save the state of the game into mongo
  const gamesCollection = mongoClient.collection('games');
  await mongoDbHelpers.updateOneByObjectId(gamesCollection, ObjectId(game._id), game);
};
