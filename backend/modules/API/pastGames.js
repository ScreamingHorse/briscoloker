const debug = require('debug')('briscoloker:pastGames');

module.exports = (mongoClient, token) => {
  debug('getting past games', token);
  return new Promise(async (resolve, reject) => {
    try {
      const dataFromMongo = await mongoClient.getLimitlessStuffFromMongo(
        'gamesPlayed',
        { 'players.id': { $in: [token] } },
        {},
      );
      // map the data for the frontend
      const games = dataFromMongo.map(G => ({
        winner: G.winnerOfTheWholeThing,
        id: G._id,
        played: G.created,
      }));
      resolve(games);
    } catch (e) {
      reject(e);
    }
  });
};
