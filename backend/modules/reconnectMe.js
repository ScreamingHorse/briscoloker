const debug = require('debug')('briscoloker:reconnectMe');
const mongoHelpers = require("./mongoDbHelpers");

module.exports = async(socket, mongoClient, token) => {
  try{
    //1.check if any match for this token exist
    const gamesCollection = mongoClient.collection('games');
    const searchObject = {"players.id":{$in: [token]}};
    //we are looking for any game where one of the players is the token
    debug('searchObject', searchObject);
    let myGame = await mongoHelpers.getStuffFromMongo(gamesCollection,searchObject,{},1);
    debug('mygame', myGame);
    if (myGame.length === 1) {
      //2.if exists, I just need to rejoing the socket.io room
      const myRoom = myGame[0].name;
      socket.join(myRoom);
      //looking for the other player (it is the player with the different token)
      let villan = myGame[0].players
        .filter(P => {
          return P.id !== token
        })
        .map(P => {
          return {
            name : P.name
          }
        })[0];
      socket.emit('villan_info',{result: villan});
    } else {
      //game not found, emit false to villan_info (the topic that the client is listening to start the game)
      socket.emit('villan_info',{result : false});
    }
  } catch (e) {
    console.log(e);
    //game not found, emit false to villan_info (the topic that the client is listening to start the game)
    socket.emit('villan_info',{result : false});
  }
}