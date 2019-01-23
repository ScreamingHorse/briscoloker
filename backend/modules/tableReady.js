const debug = require('debug')('briscoloker:tableReady');
const ObjectId = require("mongodb").ObjectID;

module.exports = (socket, mongoClient) => {
  const closedRoomCollection = mongoClient.collection('closedRoom');
  const searchObject = {
    players: {
      $elemMatch : {
        id : socket.id
      }
    }
  };
  closedRoomCollection.find(searchObject).limit(1).toArray((err, roomFromMongo) => {
    if (err) {
      console.log(err);
      throw new Error(err);
    }
    const myRoom = roomFromMongo[0];
    if (typeof myRoom !== "undefined") {
      debug("myRoom",myRoom);
      let villan = myRoom.players
        .filter(P => {
          return P !== socket.id
        })
        .map(P => {
          return {
            name : P
          }
        })[0];
      socket.emit('villan_info',villan);
      debug("Emitted villan info");
      //check if the other is ready
      let hero = myRoom.players
        .filter(P => {
          return P === socket.id
        });
      hero[0].isReady = true;
      closedRoomCollection.updateOne({_id:ObjectId(roomToJoin._id)},myRoom,(err,results) => {
        if (villan.isReady) {
          console.log('Villan ready');
        } else {
          console.log('Villan not ready');
        }
      });
    }
  });
}
