import React, { Component } from 'react';
import Io from 'socket.io-client';
import { WEBSOCKET_SERVER } from '../config';
import './Lobby.css';


class Lobby extends Component {

  constructor(props) {
    super(props);
    this.handlePlay = this.handlePlay.bind(this);
    this.handleGoToTheGame = this.handleGoToTheGame.bind(this);

    this.socket = Io(WEBSOCKET_SERVER);
    this.socket.on('connect', () => {
      console.log("I am connected")
    });
    this.socket.on('briscoloker/connected', (data) => {
      console.log("something happened", data);
    });
    this.socket.on('disconnect', () => {
      console.log("I am disconnected")
    });
    this.socket.on('match_ready', (roomName) => {
      console.log("The game is ready on", roomName);
      clearInterval(this.searchTimer);
      this.setState({
        isSearching : false,
        isRoomReady: true,
      });
      setTimeout(()=>{
        this.handleGoToTheGame();
      }, 2000)
    });
    this.state = {
      isSearching : false,
      searchTime : 0,
    };
  }

  handleGoToTheGame() {
    this.props.history.push('/game');
  }

  handlePlay() {
    //when a player clicks play, it create a new room or it will join an avaialble room
    // 1. Tell the server you are looking for a game
    this.socket.emit('join_lobby');
    // 2. wait for someone to join
    this.searchTimer = setInterval(() => {
      this.setState({
        searchTime: this.state.searchTime + 1,
      });
    },1000);
    this.setState({
      isSearching : true,
      searchTime: 0,
    });
  }

  render() {
    return (
      <div className="Lobby">
      {this.state.isSearching ?
        <div>
          Looking for a game, please be patient while we are looking for an oppenent.
          Searching for {this.state.searchTime} seconds
        </div>
      : null
      }
      {this.state.isRoomReady ?
        <div>
          Get ready to play, the game is starting shortly
        </div>
      : null
      }
      {!this.state.isSearching && !this.state.isRoomReady ?
      <button onClick={this.handlePlay}>Play!</button> : null
      }
        
      </div>
    );
  }
}

export default Lobby;
