const debug = require('debug')('briscoloker:briscolokerHelpers');
const resolveHand = require('./briscoloker/resolveHand');
const startTheGameWillYa = require('./briscoloker/startTheGameWillYa');
const betting = require('./briscoloker/betting');
const getMyGameBro = require('./briscoloker/getMyGameBro');
const playACard = require('./briscoloker/playACard');
const fold = require('./briscoloker/fold');

const updateHero = async (token, mongoClient, stuffToUpdate) => {
  try {
    // 1 get my game
    const game = await getMyGameBro(token, mongoClient);
    const hero = game.players.filter(P => P.id === token)[0];
    const allTheKeysToUpdate = Object.keys(stuffToUpdate);
    debug('allTheKeysToUpdate', allTheKeysToUpdate);
    for (let idx = 0; idx < allTheKeysToUpdate.length; idx++) {
      const key = allTheKeysToUpdate[idx];
      debug(`Updating ${key} with ${stuffToUpdate[key]}`);
      hero[key] = stuffToUpdate[key];
      await mongoClient.updateOneByObjectId('games', game._id, game);
    }
  } catch (e) {
    throw Error(e);
  }
};

const getVillan = async (token, mongoClient) => {
  // 1 get my game
  const game = await getMyGameBro(token, mongoClient);
  const villan = game.players.filter(P => P.id !== token)[0];
  return villan;
};

const formatOutput = async (token, mongoClient) => {
  const game = await getMyGameBro(token, mongoClient);
  const villan = game.players.filter(P => P.id !== token)[0];
  const hero = game.players.filter(P => P.id === token)[0];
  const gameState = {
    logs: game.logs,
    villan: villan ? {
      name: villan.name ? villan.name : '',
      score: villan.score ? villan.score : 0,
      chips: villan.chips ? villan.chips : 0,
      roundLeader: villan.roundLeader ? villan.roundLeader : false,
      initiative: villan.initiative ? villan.initiative : false,
      cardsCaptured: villan.cardsCaptured ? villan.cardsCaptured : [],
      currentHand: villan.currentHand ? villan.currentHand : [],
      cardsInHand: villan.hand ? villan.hand.length : 0,
    } : {},
    hero,
    discardedCards: game.discardedCards ? game.discardedCards.length : 0,
    trumpCard: game ? game.trumpCard : {},
    sideBet: game ? game.sideBet : 0,
    currentHand: game ? game.currentHand : [],
    deck: {
      cardLeft: game.deck ? game.deck.length : 0,
    },
    gameState: {
      isTheRoundFinished: game.isTheRoundFinished,
      isTheGameFinished: game.isTheGameFinished,
      lastRoundWinner: game.lastRoundWinner,
      winnerOfTheWholeThing: game.winnerOfTheWholeThing,
      round: game.round,
    },
  };
  return gameState;
};

const sendAllTheGameStates = async (io, gameName, mongoClient) => {
  try {
    const clients = Object.keys(io.sockets.adapter.rooms[gameName].sockets);
    debug(clients, clients.length);
    for (let idx = 0; idx < clients.length; idx++) {
      // debug("idx",idx);
      const client = io.sockets.connected[clients[idx]];
      const clientToken = client.token;
      debug(clientToken);
      const gameState = await formatOutput(clientToken, mongoClient);
      // console.log('gameState',gameState);
      client.emit('game_state', { result: gameState });
    }
  } catch (e) {
    console.error(e);
    throw e;
  }
};

module.exports = {
  getMyGameBro,
  getVillan,
  updateHero,
  startTheGameWillYa,
  formatOutput,
  betting,
  sendAllTheGameStates,
  playACard,
  resolveHand,
  fold,
};
