const debug = require('debug')('briscoloker:tableReady');
const briscolokerHelpers = require('./briscolokerHelpers');

module.exports = async (socket, mongoClient, token) => {
  try {
    //I want to send only relevant data to the client, avoiding sending deck and villan infos
    gameState = await briscolokerHelpers.formatOutput(token, mongoClient);
    debug('Sending to game_state', gameState);
    socket.emit('game_state',{result: gameState});
  } catch (e) {
    console.error(e);
    socket.emit('game_state',{result : false});
  }
}
