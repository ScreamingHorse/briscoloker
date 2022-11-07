import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import * as serviceWorker from './serviceWorker';
import Routes from './routes';
import { BrowserRouter } from 'react-router-dom';
import Io from 'socket.io-client';

if (!window.socket) {
  let token = localStorage.getItem('token');
  //console.log('process.env.REACT_APP_WEBSOCKET_SERVER', process.env.REACT_APP_WEBSOCKET_SERVER)
  window.socket= Io(process.env.REACT_APP_WEBSOCKET_SERVER, {query: `token=${token}`});
  window.socket.on('disconnect', () => {
    //if (window.location.href !== process.env.REACT_APP_HOMEPAGE) window.location.href = process.env.REACT_APP_HOMEPAGE;
  });
}
ReactDOM.render(<BrowserRouter><Routes /></BrowserRouter>, document.getElementById('root'));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: http://bit.ly/CRA-PWA
serviceWorker.unregister();
