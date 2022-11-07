
const debug = require('debug')('briscoloker:briscolokerHelpers:fold');
const getMyGameBro = require('./getMyGameBro');

module.exports = async (token, mongoClient, isHuman) => {
  debug('token', token);
  const game = await getMyGameBro(token, mongoClient);
  const hero = game.players.filter(P => P.id === token)[0];
  const villan = game.players.filter(P => P.id !== token)[0];
  const { currentHand } = game;

  game.logs.push({
    time: new Date().getTime(),
    log: `${hero.name} folded`,
  });

  // 1. mark the hand as folded
  currentHand.isFolded = true;
  currentHand.isBettingPhase = false;
  // 2. give away initiative
  hero.initiative = false;
  villan.initiative = true;
  // 3. villan win the hand
  currentHand.winner = villan.id;
  // 4. update the timer
  game.timer = new Date().getTime();
  // 4.1 if human, update timeout
  if (isHuman) game.lastHumanMove = new Date().getTime();
  // 5. save the state of the game into mongo
  await mongoClient.updateOneByObjectId('games', game._id, game);
};
