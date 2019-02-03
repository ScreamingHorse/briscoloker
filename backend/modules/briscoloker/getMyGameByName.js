const debug = require('debug')('briscoloker:briscolokerHelpers:getMyGameByName');

module.exports = async (gameName, mongoClient) => {
  try {
    const searchObject = { name: gameName };
    // we are looking for the specifc game with the specific name
    debug('searchObject', searchObject);
    const myGame = await mongoClient.getStuffFromMongo('games', searchObject, {}, 1);
    if (myGame.length === 1) {
      return myGame[0];
    }
    return null;
  } catch (e) {
    throw Error(e);
  }
};
