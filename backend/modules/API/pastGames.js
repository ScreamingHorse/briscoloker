const debug = require('debug')('briscoloker:pastGames');

module.exports = (mongoClient, token) => {
  debug('getting past games', token);
  return new Promise((resolve, reject) => {
    try {
      const usersCollection = mongoClient.collection('gamesPlayed');
      const searchObject = { 'players.id': { $in: [token] } };
      debug('search obj', searchObject);
      usersCollection.find(searchObject).toArray((error, data) => {
        try {
          if (error) {
            throw error;
          }
          // map the data for the frontend
          const games = data.map((G) => {
            return {
              winner: G.winnerOfTheWholeThing,
              id: G._id,
              played: G.created,
            };
          });
          resolve(games);
        } catch (e) {
          reject(e);
        }
      });
    } catch (e) {
      reject(e);
    }
  });
};
