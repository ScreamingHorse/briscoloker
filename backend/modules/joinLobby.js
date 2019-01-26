const debug = require('debug')('briscoloker:joinLobby');
const ObjectId = require("mongodb").ObjectID;
const mongoDbHelpers = require('./mongoDbHelpers');
const briscolokerHelpers = require('./briscolokerHelpers');

module.exports = async (socket, io, mongoClient, token) => {
  debug("Need to join a room");
  // Get the documents collection
  const openRoomsCollection = mongoClient.collection('openRooms');
  const gamesCollection = mongoClient.collection('games');
  const usersCollecion = mongoClient.collection('users');
  try {
    //(try to) find an open room
    const openRooms = await mongoDbHelpers.getStuffFromMongo(openRoomsCollection,{},{created: 1},1);
    console.log('openRooms',openRooms);
    //1 check if there are available room (meaning a game is already waiting to start)
    if (openRooms.length === 1) {
      const roomToJoin = openRooms[0];
      debug("Joining and existing room", roomToJoin);
      //1. Remove the room from available rooms
      let deleteResult = await mongoDbHelpers.deleteOneByObjectId(openRoomsCollection,ObjectId(roomToJoin._id));
      if (deleteResult) {
        //2. Update the room object with the current socket ID
        //2.1 Get user info from DB
        let user = await mongoDbHelpers.getStuffFromMongo(usersCollecion,{_id:ObjectId(token)},{},1);
        roomToJoin.players.push({
          id : token,
          name : user[0].username,
          isReady : false,
        },);
      }
      //3. Move the room the game collection (insert the room into games collection => no on ecan join this room anymore)
      let result = await mongoDbHelpers.insertOneThingInMongo(gamesCollection, roomToJoin);
      if (result) {
        //the game is ready, joining the socket.io room
        debug("Joining", roomToJoin.name);
        socket.join(roomToJoin.name, async ()=> {
          debug("MATCH READY:",roomToJoin);
          //before notifing the client, I'll start the game
          //I need to start the game!
          gameState = await briscolokerHelpers.startTheGameWillYa(roomToJoin.name, mongoClient);
          debug(gameState);
          //notify the room (both sockets) that the game is ready to play
          setTimeout(() => {
            //the game is ready, notifi the 2 clients
            io.to(roomToJoin.name).emit('match_ready');
            //debug("Notification sent for the room", roomToJoin.name);
          }, 2000);
        });
      }
    } else {
      //2 no rooms, I need to create one
      let roomName = "MagicRoom";
      //Grab user information from the DB
      let user = await mongoDbHelpers.getStuffFromMongo(usersCollecion,{_id:ObjectId(token)},{},1);
      console.log('user',user);
      roomObject = {
        name : roomName,
        created : new Date(),
        players : [
          {
            id : token,
            name : user[0].username,
            isReady : false,
          },
        ]
      };
      //creating the room in mongo DB
      let insertResult = await mongoDbHelpers.insertOneThingInMongo(openRoomsCollection,roomObject);
      //if no errors while inserting we are good
      //so I join the socket.io room and wait for the 
      //other player
      if (insertResult) {
        debug("Room created", roomObject);
        socket.join(roomName);
      }
    }
  } catch (e) {
    console.error(e);
  }
}