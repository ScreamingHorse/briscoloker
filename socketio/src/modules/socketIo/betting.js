const debug = require('debug')('briscoloker:betting');
const briscolokerHelpers = require('../briscolokerHelpers');

module.exports = async (io, mongoClient, token, bet, isHuman) => {
  try {
    // 1 check if the token can bet
    const game = await briscolokerHelpers.getMyGameBro(token, mongoClient);
    // debug(game);
    const player = game.players.filter(P => P.id === token)[0];

    // 2 bet
    // The player can bet if he's got the initiative and the game is in betting phase
    if (player.initiative && game.currentHand.isBettingPhase) {
      debug('token', token);
      debug('bet', bet);
      await briscolokerHelpers.betting(token, mongoClient, bet, isHuman);
    }
    // 3 send the specifc game state to each player
    await briscolokerHelpers.sendAllTheGameStates(io, game.name, mongoClient);
  } catch (e) {
    console.error(e);
  }
};
