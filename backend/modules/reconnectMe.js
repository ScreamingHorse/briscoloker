const debug = require('debug')('briscoloker:reconnectMe');
const ObjectId = require("mongodb").ObjectID;

module.exports = (socket, mongoClient, payload) => {
    //1.check if the match id exists
    const matchId = payload.matchId;
    const oldSocketId = payload.oldSocketId;
    debug('Match Id', matchId);
    debug('Old socket', oldSocketId);
    const closedRoomCollection = mongoClient.collection('closedRoom');
    const searchObject = {
      players: {
        $in : [
          oldSocketId
        ]
      }
    };
    closedRoomCollection.find(searchObject).limit(1).toArray((err, roomFromMongo) => {
      if (err) {
        console.log(err);
        throw new Error(err);
      }
      debug("roomFromMongo",roomFromMongo);
      if (roomFromMongo.length === 1) {
        //2.if exists, I assume the socket.id is authenticated
        //  switch the socket id inside room with this one 
        const myRoom = roomFromMongo[0];
        //remove the old socket id from the players
        myRoom.players.splice(myRoom.players.indexOf(oldSocketId),1);
        myRoom.players.push(socket.id);
        closedRoomCollection.updateOne({_id:ObjectId(roomToJoin._id)},myRoom,(err,results) => {
          if (err) {
            console.log(err);
            throw new Error(err);
          }
          socket.join(myRoom.name);
          //looking for the other player
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
        })
      }
    })
}