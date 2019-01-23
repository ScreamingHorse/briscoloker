import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import * as serviceWorker from './serviceWorker';
import Routes from './routes';
import { BrowserRouter } from 'react-router-dom';

//I create the socket.io client on window so I can access it everywhere
import Io from 'socket.io-client';
import { WEBSOCKET_SERVER } from './config';
if (!window.socket)
  window.socket= Io(WEBSOCKET_SERVER);


window.socket.on('disconnect', () => {
  console.log("I am disconnected")
});

ReactDOM.render(<BrowserRouter><Routes /></BrowserRouter>, document.getElementById('root'));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: http://bit.ly/CRA-PWA
serviceWorker.unregister();
