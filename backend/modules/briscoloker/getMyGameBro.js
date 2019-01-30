const debug = require('debug')('briscoloker:briscolokerHelpers:getMyGameBro');
const mongoDbHelpers = require('../mongoDbHelpers');

module.exports = async (token, mongoClient) => {
  try {
    const gamesCollection = mongoClient.collection('games');
    const searchObject = { 'players.id': { $in: [token] } };
    // we are looking for any game where one of the players is the token
    debug('searchObject', searchObject);
    const myGame = await mongoDbHelpers.getStuffFromMongo(gamesCollection, searchObject, {}, 1);
    if (myGame.length === 1) {
      return myGame[0];
    }
    return null;
  } catch (e) {
    throw e;
  }
};
