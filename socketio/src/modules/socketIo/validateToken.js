const debug = require('debug')('briscoloker:validateToken');

module.exports = async (mongoClient, token, io, socket) => {
  try {
    // 1 check if the token and get the userId
    const userId = await mongoClient.getStuffFromMongo('tokens', {
      token,
    }, {}, 1);
    debug(userId);
    // 2 if token is valid,  return the userId
    if (userId.length === 1) {
      // 2.5 I need to close the other connections that have the same user id.
      const xSockets = Object.keys(io.sockets.sockets);
      for (let idx = 0; idx < xSockets.length; idx++) {
        const client = io.sockets.connected[xSockets[idx]];
        debug('socket from the list', client.id);
        debug('my socket', socket.id);
        if (socket.id !== client.id) {
          if (client.token === userId[0].userId.toString()) {
            client.disconnect();
          }
        }
      }
      debug('xSockets', xSockets);
      return userId[0].userId.toString();
    }
    // 3 if token is not valid, close the websocket and return null
    socket.disconnect();
    return null;
  } catch (e) {
    console.error(e);
    return null;
  }
};
