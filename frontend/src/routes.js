import React from 'react';
import { Switch, Route } from 'react-router-dom';
import Game from './Game/Game';
import Lobby from './Lobby/Lobby';

const Routes = () => (
  <Switch>
    <Route path="/game" component ={Game} />
    <Route path="/" component ={Lobby} />
  </Switch>
)

export default Routes;