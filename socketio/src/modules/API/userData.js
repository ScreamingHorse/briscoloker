const debug = require('debug')('briscoloker:userData');
const ObjectId = require('mongodb').ObjectID;

module.exports = (mongoClient, token) => {
  debug('getting past games', token);
  return new Promise(async (resolve, reject) => {
    try {
      // 1 check if the token and get the userId
      const userIdfromMongo = await mongoClient.getStuffFromMongo('tokens', {
        token,
      }, {}, 1);
      if (userIdfromMongo.length === 1) {
        const userId = userIdfromMongo[0].userId.toString();
        const dataFromMongo = await mongoClient.getLimitlessStuffFromMongo(
          'gamesPlayed',
          { 'players.id': userId },
          {},
        );
        // map the data for the frontend
        // debug(userId[0]);
        const games = dataFromMongo.map((G) => {
          debug(userId, G.gameWinner.id, G.players);
          const player = G.players.find(P => P.id === userId);
          debug(player);
          const { ratingChange } = player;
          return {
            didIwin: (userId === G.gameWinner.id),
            winner: G.winnerOfTheWholeThing,
            id: G._id,
            played: G.created,
            gameType: G.gameType === 'ranked' ? 'ranked' : 'normal',
            ratingChange,
          };
        });
        // get the user info
        // debug('userInfo search obj', { _id: userId });
        const userInfo = await mongoClient.getStuffFromMongo('users', { _id: ObjectId(userId) }, {}, 1);
        resolve({
          games,
          userInfo: {
            username: userInfo[0].username,
            lastLogin: userInfo[0].lastLogin,
            losses: userInfo[0].losses,
            wins: userInfo[0].wins,
            rating: userInfo[0].rating,
          },
        });
      }
      resolve([]);
    } catch (e) {
      reject(e);
    }
  });
};
