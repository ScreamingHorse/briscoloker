const debug = require("debug")('briscoloker:briscolokerHelpers:getMyGameByName');
const mongoDbHelpers = require('../mongoDbHelpers');

module.exports = async (gameName, mongoClient) => {
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