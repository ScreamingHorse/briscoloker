const debug = require('debug')('briscoloker:stopLooking');
const briscolokerHelpers = require('../briscolokerHelpers');

module.exports = async (mongoClient, token) => {
  try {
    // check if the player is already looking for a game
    const waitingGame = await briscolokerHelpers.getMyWaitingGameBro(token, mongoClient);
    debug('game to delete', waitingGame);
    // delete from mongo
    await mongoClient.deleteOneByObjectId('openRooms', waitingGame._id);
  } catch (e) {
    console.error(e);
  }
};
