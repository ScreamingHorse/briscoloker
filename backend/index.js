const app = require('express')();
const bodyParser = require('body-parser');
const cors = require('cors');

//middlewares
app.use(cors());
app.use(bodyParser());

//servers
const http = require('http').Server(app);
const io = require('socket.io')(http);

const debug = require('debug')('briscoloker:index');
const MongoClient = require('mongodb').MongoClient;
const url = 'mongodb://localhost:27017';
let briscolokerMongoClient = null;

// Use connect method to connect to the server
MongoClient.connect(url, { useNewUrlParser: true }, (err, client) => {
  if (err) {
    console.error(err);
    return false;
  }
  briscolokerMongoClient = client.db('briscoloker');
  console.log("Connected successfully to mongo server");
});

//SOCKET.IO Modules
const joinLobby = require('./modules/joinLobby');
const tableReady = require('./modules/tableReady');
const reconnectMe = require('./modules/reconnectMe');
const betting = require('./modules/betting');
const playACard = require('./modules/playACard');

//API Modules
const registerUser = require('./modules/registerUser');
const loginUser = require('./modules/loginUser');


app.post('/login', async (req, res) => {
  //awaiting the response from the registration module
  let response = {};
  let httpStatus = 200;
  try {
    token = await loginUser(briscolokerMongoClient, req.body.username, req.body.password);
    response = {
      token
    }
  } catch (error) {
    httpStatus = 401;
    response = {
      error
    };
  }
  res
    .status(httpStatus)
    .json(response);
});

app.post('/register', async (req, res) => {
  //awaiting the response from the registration module
  let response = {};
  let httpStatus = 200;
  try {
    token = await registerUser(briscolokerMongoClient, req.body.username, req.body.password);
    response = {
      token
    }
  } catch (error) {
    httpStatus = 500;
    response = {
      error
    };
  }
  res
    .status(httpStatus)
    .json(response);
})

io.on('connection', (socket) => {
  debug('a user is connected', socket.id);
  console.log("Query string of the socket",socket.handshake.query);
  socket.token = socket.handshake.query.token;
  //triggered on reconnection
  socket.on('reconnect_me',async (payload)=>{
    debug('message for reconnect_me payload', payload);
    await reconnectMe(socket, briscolokerMongoClient, payload.token);
  });

  //triggered when the browser goes to /game
  socket.on('table_ready',async (payload)=>{
    debug('message for table_ready payload', payload);
    await tableReady(socket, briscolokerMongoClient, payload.token);
  })

  ///triggerred when the player press play
  socket.on('join_lobby', async (payload) => {
    //@todo: validate the tokens
    debug('message for join_lobby', payload);
    await joinLobby(socket, io, briscolokerMongoClient, payload.token);
  });

  //the client send a message when the player is betting
  socket.on('betting', async (payload) => {
    debug('message for betting', payload);
    await betting(io, briscolokerMongoClient, payload.token, payload.bet);
  });

  //the client send a message when the player plays a card
  socket.on('play_a_card', async (payload) => {
    debug('message for play_a_card', payload);
    await playACard(io, briscolokerMongoClient, payload.token, payload.card);
  });


});

http.listen(3001, () => {
  console.log('listening on *:3001');
});