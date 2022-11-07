const debug = require('debug')('briscoloker:tableReady');
const briscolokerHelpers = require('../briscolokerHelpers');

module.exports = async (socket, mongoClient, token) => {
  try {
    // I want to send only relevant data to the client, avoiding sending deck and villan infos
    const gObject = await briscolokerHelpers.formatOutput(token, mongoClient);
    debug('Sending to game_state', gObject.gameState);
    socket.emit('game_state', { result: gObject.gameState });
    console.log(gObject.roomName);
    return gObject.roomName;
  } catch (e) {
    console.error(e);
    socket.emit('game_state', { result: false });
    return null;
  }
};
