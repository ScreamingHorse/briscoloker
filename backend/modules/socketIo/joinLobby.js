const debug = require('debug')('briscoloker:joinLobby');
const ObjectId = require('mongodb').ObjectID;
const briscolokerHelpers = require('../briscolokerHelpers');

const getARoom = () => {
  const letters = 'qwertyuioplkjhgfdsazxcvbnm0987654321';
  let name = '';
  for (let idx = 0; idx < 25; idx++) {
    name = name.concat(letters[Math.floor(Math.random() * Math.floor(letters.length))]);
  }
  name = name.concat(new Date().getTime().toString());
  return name;
};

module.exports = async (socket, io, mongoClient, token) => {
  debug('Need to join a room');
  try {
    // check if the player is already in a match
    const playersGame = await briscolokerHelpers.getMyGameBro(token, mongoClient);
    debug('playersGame', playersGame);
    // game found I do not need to join nor create another room
    if (playersGame !== null) {
      socket.join(playersGame.name);
      io.to(playersGame.name).emit('match_ready');
      return;
    }
    // (try to) find an open room
    const openRooms = await mongoClient.getStuffFromMongo(
      'openRooms',
      {},
      { created: 1 },
      1,
    );
    console.log('openRooms', openRooms);
    // 1 check if there are available room (meaning a game is already waiting to start)
    if (openRooms.length === 1) {
      const roomToJoin = openRooms[0];
      debug('Joining and existing room', roomToJoin);
      // 1. Remove the room from available rooms
      const deleteResult = await mongoClient.deleteOneByObjectId(
        'openRooms', roomToJoin._id,
      );
      if (deleteResult) {
        // 2. Update the room object with the current socket ID
        // 2.1 Get user info from DB
        const user = await mongoClient.getStuffFromMongo(
          'users',
          { _id: ObjectId(token) },
          {},
          1,
        );
        roomToJoin.logs.push({
          time: new Date().getTime(),
          log: `${user[0].username} joined the game`,
        });
        roomToJoin.players.push({
          id: token,
          name: user[0].username,
          isReady: false,
        });
      }
      // 3. Move the room the game collection
      // (insert the room into games collection => no one can join this room anymore)
      const result = await mongoClient.insertOneThingInMongo('games', roomToJoin);
      if (result) {
        // the game is ready, joining the socket.io room
        debug('Joining', roomToJoin.name);
        socket.join(roomToJoin.name, async () => {
          debug('MATCH READY:', roomToJoin);
          // before notifing the client, I'll start the game
          // I need to start the game!
          const gameState = await briscolokerHelpers.startTheGameWillYa(
            roomToJoin.name,
            mongoClient,
          );
          debug(gameState);
          // notify the room (both sockets) that the game is ready to play
          setTimeout(() => {
            // the game is ready, notifi the 2 clients
            io.to(roomToJoin.name).emit('match_ready');
            // debug("Notification sent for the room", roomToJoin.name);
          }, 2000);
        });
      }
    } else {
      // 2 no rooms, I need to create one
      const roomName = getARoom();
      // Grab user information from the DB
      const user = await mongoClient.getStuffFromMongo(
        'users',
        { _id: ObjectId(token) },
        {},
        1,
      );
      console.log('user', user);
      const roomObject = {
        name: roomName,
        created: new Date(),
        logs: [
          {
            time: new Date().getTime(),
            log: `${user[0].username} created the game`,
          },
        ],
        players: [
          {
            id: token,
            name: user[0].username,
            isReady: false,
          },
        ],
      };
      // creating the room in mongo DB
      const insertResult = await mongoClient.insertOneThingInMongo(
        'openRooms',
        roomObject,
      );
      // if no errors while inserting we are good
      // so I join the socket.io room and wait for the
      // other player
      if (insertResult) {
        debug('Room created', roomObject);
        socket.join(roomName);
      }
    }
  } catch (e) {
    console.error(e);
  }
};
