const debug = require('debug')('briscoloker:broadcastChatMessage');
const briscolokerHelpers = require('../briscolokerHelpers');

module.exports = async (io, briscolokerMongoClient, token, socket, userId, message) => {
  debug('Need to broadcast a message');
  try {
    const playersGame = await briscolokerHelpers.getMyGameBro(userId, briscolokerMongoClient);
    debug(io.sockets.adapter.rooms[playersGame.name], '-', playersGame.name);
    if (typeof io.sockets.adapter.rooms[playersGame.name] !== 'undefined') {
      debug('Sending a message');
      const clients = Object.keys(io.sockets.adapter.rooms[playersGame.name].sockets);
      debug(clients, clients.length);
      for (let idx = 0; idx < clients.length; idx++) {
        // debug("idx",idx);
        const client = io.sockets.connected[clients[idx]];
        const clientToken = client.token;
        debug('clientToken', clientToken);
        // console.log('gameState',gameState);
        client.emit('chat', { message, token });
      }
    }
  } catch (e) {
    console.error(e);
  }
};
