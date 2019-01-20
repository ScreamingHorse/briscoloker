const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);

const openRooms = [];
const closedRooms = [];

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', (socket) => {
  console.log('a user is connected', socket.id);
  socket.on('join_lobby',(data) => {
    console.log("Need to join a room");
    //1 check if there are available room
    if (openRooms.length > 0) {
      console.log("Joining and existing room");
      //I can pop because I unshift so the last element is the first in
      let roomToJoin = openRooms.pop();
      roomToJoin.players.push(socket.id);
      console.log("Joining", roomToJoin.name);
      socket.join(roomToJoin.name, ()=> {
        console.log("MATCH READY:",roomToJoin);
        closedRooms.push(roomToJoin);
        setTimeout(() => {
          io.to(roomToJoin.name).emit('match_ready', roomToJoin.name);
          console.log("Notification sent for the room", roomToJoin.name);
        }, 2000);
        
      });
    } else {
      //2 no rooms, I need to create one
      let roomName = "MagicRoom";
      openRooms.unshift({
        name : roomName,
        players : [
          socket.id,
        ]
      });
      console.log("Room added", openRooms);
      socket.join(roomName);
    }
  });
  socket.emit("briscoloker/connected",{
    result:"success"
  },(data)=> {
    console.log(data);
  });
});



http.listen(3001, () => {
  console.log('listening on *:3001');
});