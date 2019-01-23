import React from 'react';
import { Switch, Route } from 'react-router-dom';
import Game from './Game/Game';
import Lobby from './Lobby/Lobby';
import Login from './Login/Login';

const Routes = () => (
  <Switch>
    <Route path="/game" component ={Game} />
    <Route path="/lobby" component ={Lobby} />
    <Route path="/" component ={Login} />
  </Switch>
)

export default Routes;