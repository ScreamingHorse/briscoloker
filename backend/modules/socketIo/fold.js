const debug = require('debug')('briscoloker:fold');
const briscolokerHelpers = require('../briscolokerHelpers');

module.exports = async (io, mongoClient, token) => {
  try {
    // 1 check if the token can bet
    const game = await briscolokerHelpers.getMyGameBro(token, mongoClient);
    // debug(game);
    const player = game.players.filter(P => P.id === token)[0];

    // 2 bet
    // The player can bet if he's got the initiative and the game is in betting phase
    if (player.initiative && game.currentHand.isBettingPhase) {
      debug('token', token);
      await briscolokerHelpers.fold(token, mongoClient);
    }
    // 3  send the specifc game state to each player
    await briscolokerHelpers.sendAllTheGameStates(io, game.name, mongoClient);
  } catch (e) {
    console.error(e);
  }
};
