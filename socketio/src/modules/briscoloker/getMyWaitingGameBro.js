const debug = require('debug')('briscoloker:briscolokerHelpers:getMyWaitingGameBro');

module.exports = async (token, mongoClient) => {
  try {
    const searchObject = { 'players.id': { $in: [token] } };
    // we are looking for any game where one of the players is the token
    debug('searchObject', searchObject);
    const myGame = await mongoClient.getStuffFromMongo('openRooms', searchObject, {}, 1);
    if (myGame.length === 1) {
      return myGame[0];
    }
    return null;
  } catch (e) {
    throw e;
  }
};
