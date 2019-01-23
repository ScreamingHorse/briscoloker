const debug = require('debug')('briscoloker:joinLobby');
const ObjectId = require("mongodb").ObjectID;

module.exports = async (socket, io, mongoClient) => {
  debug("Need to join a room");
  // Get the documents collection
  const openRoomsCollection = mongoClient.collection('openRooms');
  const closedRoomCollection = mongoClient.collection('closedRoom');
  //Find some documents
  openRoomsCollection.find({}).sort({created: 1}).limit(1).toArray((err, openRoom) => {
    debug("Found the following records", openRoom);
    //1 check if there are available room
    if (openRoom.length === 1) {
      const roomToJoin = openRoom[0];
      debug("Joining and existing room", roomToJoin);
      //1. Remove the room from available rooms
      openRoomsCollection.deleteOne({_id:ObjectId(roomToJoin._id)}, (err,result) => {
        if (err) {
          console.error(error);
          throw new Error(err);
        };
        //2. Update the room object with the current socket ID
        roomToJoin.players.push({
          id : socket.id,
          name : socket.id,
          isReady : false,
        },);
        //3. Move the room to closed rooms (insert the room into closed room collection)
        closedRoomCollection.insertOne(roomToJoin, (err, result)=> {
          if (err) {
            console.error(error);
            throw new Error(err);
          }
          debug("Joining", roomToJoin.name);
          socket.join(roomToJoin.name, ()=> {
            debug("MATCH READY:",roomToJoin);
            setTimeout(() => {
              io.to(roomToJoin.name).emit('match_ready', roomToJoin.name);
              debug("Notification sent for the room", roomToJoin.name);
            }, 2000);
          });
        });
      });
    } else {
      //2 no rooms, I need to create one
      let roomName = "MagicRoom";
      roomObject = {
        name : roomName,
        created : new Date(),
        players : [
          {
            id : socket.id,
            name : socket.id,
            isReady : false,
          },
        ]
      };
      openRoomsCollection.insertOne(roomObject,(err,result) => {
        if (err) {
          console.error(error);
          throw new Error(err);
        }
        debug("Room added", roomObject);
        socket.join(roomName);
      })
    }
  });
}