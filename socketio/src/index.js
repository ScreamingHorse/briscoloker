const app = require('express')();
const bodyParser = require('body-parser');
const cors = require('cors');

// middlewares
app.use(cors());
app.use(bodyParser());

// servers
const http = require('http').Server(app);
const io = require('socket.io')(http);
const debug = require('debug')('briscoloker:index');
const briscolokerMongoClient = require('./modules/mongoDbHelpers')(`${process.env.MONGO_CONNECTION_STRING}`);

// SOCKET.IO Modules
const joinLobby = require('./modules/socketIo/joinLobby');
const tableReady = require('./modules/socketIo/tableReady');
const reconnectMe = require('./modules/socketIo/reconnectMe');
const betting = require('./modules/socketIo/betting');
const playACard = require('./modules/socketIo/playACard');
const fold = require('./modules/socketIo/fold');
const validateToken = require('./modules/socketIo/validateToken');
const stopLooking = require('./modules/socketIo/stopLooking');
const broadcastChatMessage = require('./modules/socketIo/broadcastChatMessage');

// API Modules
const registerUser = require('./modules/API/registerUser');
const loginUser = require('./modules/API/loginUser');
const userData = require('./modules/API/userData');


app.post('/login', async (req, res) => {
  // awaiting the response from the registration module
  let response = {};
  let httpStatus = 200;
  let token = '';
  try {
    token = await loginUser(briscolokerMongoClient, req.body.username, req.body.password);
    response = {
      token,
    };
  } catch (error) {
    httpStatus = 401;
    response = {
      error,
    };
  }
  res
    .status(httpStatus)
    .json(response);
});

app.post('/register', async (req, res) => {
  // awaiting the response from the registration module
  let response = {};
  let httpStatus = 200;
  let token = [];
  try {
    token = await registerUser(
      briscolokerMongoClient,
      req.body.username,
      req.body.password,
      req.body.email,
    );
    response = {
      token,
    };
  } catch (error) {
    httpStatus = 500;
    response = {
      error,
    };
  }
  res
    .status(httpStatus)
    .json(response);
});

app.get('/user_data', async (req, res) => {
  // awaiting the response from the registration module
  let response = {};
  let httpStatus = 200;
  let userInfo = '';
  try {
    debug('headers', req.headers);
    userInfo = await userData(briscolokerMongoClient, req.headers['x-btoken']);
    response = {
      userInfo,
    };
  } catch (error) {
    httpStatus = 500;
    response = {
      error,
    };
  }
  res
    .status(httpStatus)
    .json(response);
});

const timers = [];

// this interval update all the timers for all existing games
// the timers are part of the game object
setInterval(async () => {
  const cutoff = (new Date().getTime() - (50 * 1000)); // * 1000 to get the seconds
  const cutoffHuman = (new Date().getTime() - (5 * 60 * 1000));
  // debug('cutoff', cutoff);
  const games = await briscolokerMongoClient.getLimitlessStuffFromMongo(
    'games',
    { $and: [{ timer: { $lt: cutoff } }, { lastHumanMove: { $gt: cutoffHuman } }] },
    {},
    {},
  );
  // console.log('games', games.length);
  games.forEach(async (T) => {
    // debug(T.timer, T.name, T._id);
    // call the timeout logic
    // 1. get the token of the timed out player
    const player = T.players.filter(P => P.initiative);
    // debug(player);
    const { isBettingPhase, bettingRound } = T.currentHand;
    if (isBettingPhase) {
      if (bettingRound === 1) {
        // debug('Betting 0', bettingRound);
        // first round of betting, so check
        await betting(io, briscolokerMongoClient, player[0].id, 0, false);
      } else {
        // need to fold
        // debug('Folding', bettingRound);
        await fold(io, briscolokerMongoClient, player[0].id, false);
      }
    } else {
      // playing round - Play the first card
      await playACard(io, briscolokerMongoClient, player[0].id, player[0].hand[0], false);
    }
  });
}, 5000);
// @Todo: verify that the timer every 5 seconds is good enough

io.on('connection', async (socket) => {
  console.log('a user is connected', socket.id, timers);
  debug('Query string of the socket', socket.handshake.query);
  socket.token = await validateToken(
    briscolokerMongoClient,
    socket.handshake.query.token,
    io,
    socket,
  );

  // triggered on reconnection
  socket.on('reconnect_me', async (payload) => {
    console.log('message for reconnect_me payload', payload);
    const userId = await validateToken(briscolokerMongoClient, payload.token, io, socket);
    if (userId !== null) await reconnectMe(socket, briscolokerMongoClient, userId);
  });

  // triggered when the user stop looking for a game
  socket.on('stop_looking', async (payload) => {
    console.log('message for stop_looking payload', payload);
    const userId = await validateToken(briscolokerMongoClient, payload.token, io, socket);
    if (userId !== null) await stopLooking(briscolokerMongoClient, userId);
  });

  // triggered when the browser goes to /game
  socket.on('table_ready', async (payload) => {
    console.log('message for table_ready payload', payload);
    const userId = await validateToken(briscolokerMongoClient, payload.token, io, socket);
    if (userId !== null) await tableReady(socket, briscolokerMongoClient, userId);
  });

  // triggerred when the player press play
  socket.on('join_lobby', async (payload) => {
    console.log('message for join_lobby', payload);
    const userId = await validateToken(briscolokerMongoClient, payload.token, io, socket);
    if (userId !== null) await joinLobby(socket, io, briscolokerMongoClient, userId, payload.lobby);
  });

  // the client send a message when the player is betting
  socket.on('betting', async (payload) => {
    console.log('message for betting', payload);
    const userId = await validateToken(briscolokerMongoClient, payload.token, io, socket);
    if (userId !== null) await betting(io, briscolokerMongoClient, userId, payload.bet, true);
  });

  // the client send a message when the player folds
  socket.on('fold', async (payload) => {
    console.log('message for fold', payload);
    const userId = await validateToken(briscolokerMongoClient, payload.token, io, socket);
    if (userId !== null) await fold(io, briscolokerMongoClient, userId, true);
  });

  // the client send a message when the player plays a card
  socket.on('play_a_card', async (payload) => {
    console.log('message for play_a_card', payload);
    const userId = await validateToken(briscolokerMongoClient, payload.token, io, socket);
    if (userId !== null) await playACard(io, briscolokerMongoClient, userId, payload.card, true);
  });

  // the client send a chat message to the opponnet
  socket.on('chat', async (payload) => {
    console.log('message for chat', payload);
    const userId = await validateToken(briscolokerMongoClient, payload.token, io, socket);
    if (userId !== null) await broadcastChatMessage(io, briscolokerMongoClient, payload.token, socket, userId, payload.message);
  });
});

http.listen(process.env.PORT, () => {
  console.log(`listening on *:${process.env.PORT}`);
});
