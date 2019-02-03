const debug = require('debug')('briscoloker:reconnectMe');
const briscolokerHelpers = require('../briscolokerHelpers');

module.exports = async (socket, mongoClient, token) => {
  try {
    // 1.check if any match for this token exist
    const myGame = await briscolokerHelpers.getMyGameBro(token, mongoClient);
    debug('mygame', myGame);
    // 2.if exists, I just need to rejoing the socket.io room
    const myRoom = myGame.name;
    socket.join(myRoom);
  } catch (e) {
    console.log(e);
    // game not found, emit false to villan_info
    // (the topic that the client is listening to start the game)
    socket.emit('game_state', { result: false });
  }
};
