import React from 'react';
import ReactDOM from 'react-dom';
import Game from './Game';

// mocks
window.socket = {}
window.socket.emit = () => {
  return true
}
window.socket.on = () => {
  return true
}
it('renders without crashing', () => {
  const div = document.createElement('div');
  ReactDOM.render(<Game />, div);
  ReactDOM.unmountComponentAtNode(div);
});
