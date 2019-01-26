const debug = require('debug')('briscoloker:tableReady');
const briscolokerHelpers = require('./briscolokerHelpers');

module.exports = async (socket, mongoClient, token) => {
  try {
    //1 set myself as ready
    //await briscolokerHelpers.updateHero(token, mongoClient, {
    //  isReady : true
    //});
    //3 check if the opponent is ready
    //let villan = await briscolokerHelpers.getVillan(token, mongoClient);
    //debug('villan', villan);
    //if (villan.isReady) {
    //  debug('Villan ready');
    //let game = briscolokerHelpers.getMyGameBro(token, mongoClient);
    //let gameState = {};
    //  if (game.isStarted) {
        //game already started, sending back the state of it
        //I want to send only relevant data to the client, avoiding sending deck and villan infos
    gameState = await briscolokerHelpers.formatOutput(token, mongoClient);
    debug('Sending to game_state', gameState);
    socket.emit('game_state',{result: gameState});
    //  } else {
    //    //I need to start the game!
    //    gameState = await briscolokerHelpers.startTheGameWillYa(token, mongoClient);
        //I want to send only relevant data to the client, avoiding sending deck and villan infos
    //    let outputToTheClient = await briscolokerHelpers.formatOutput(token, gameState);
    //    debug('Sending to game_state', outputToTheClient);
    //    socket.emit('game_state',{result: outputToTheClient});
    //  }
    //}
  } catch (e) {
    console.error(e);
    socket.emit('game_state',{result : false});
  }
}
