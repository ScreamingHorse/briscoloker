import React, { Component } from 'react';
import { Modal } from 'react-modal-button';
import './Lobby.css';
const axios = require('axios');
const moment = require('moment');


class Lobby extends Component {

  constructor(props) {
    super(props);
    this.joinLobby = this.joinLobby.bind(this);
    this.handlePlay = this.handlePlay.bind(this);
    this.handlePlayRanked = this.handlePlayRanked.bind(this);
    this.handleGoToTheGame = this.handleGoToTheGame.bind(this);
    this.handleLogout = this.handleLogout.bind(this)
    this.APIGetUserData = this.APIGetUserData.bind(this);
    this.handleStopLookingForAGame = this.handleStopLookingForAGame.bind(this);

    window.socket.on('match_ready', () => {
      clearInterval(this.searchTimer);
      this.setState({
        isSearching : false,
        isRoomReady: true,
      });
      setTimeout(()=>{
        this.handleGoToTheGame();
      }, 2000)
    });
    this.APIGetUserData(localStorage.getItem('token'));
    this.state = {
      isSearching: false,
      searchTime: 0,
      token: localStorage.getItem('token'),
      pastGames: [],
      userInfo: {},
    };
  }

  APIGetUserData(token) {
    axios.get(`${process.env.REACT_APP_API_ENDPOINT}/user_data`, {
      headers: {
        'x-btoken': token
      }
    })
      .then(result => {
        // debugger
        this.setState({
          pastGames : result.data.userInfo.games,
          userInfo : result.data.userInfo.userInfo,
        })
      })
      .catch(e => {
        console.error("Eroor while getting the past games")
      })
  }

  handleGoToTheGame() {
    this.props.history.push('/game');
  }

  joinLobby(lobbyType) {
    //when a player clicks play, it create a new room or it will join an avaialble room
    // 1. Tell the server you are looking for a game
    window.socket.emit('join_lobby',{
      token : this.state.token, 
      lobby: lobbyType
    });
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

  handlePlayRanked() {
    this.joinLobby('ranked')
  }

  handlePlay() {
    this.joinLobby('normal')
  }

  handleLogout() {
    localStorage.removeItem('token');
    window.location.assign('/login');
  }

  handleStopLookingForAGame() {
    clearInterval(this.searchTimer);
    window.socket.emit('stop_looking',{token : this.state.token});
    this.setState({
      isSearching : false,
    });
  }

  render() {
    return (
      <div className="Lobby">
      {this.state.isSearching ?
        <Modal isOpen={true}>
          Looking for a game, please be patient while we are looking for an opponent.
          Searching for {this.state.searchTime} seconds.
          <button onClick={this.handleStopLookingForAGame}> Stop Looking</button>
        </Modal>
      : null
      }
      {this.state.isRoomReady ?
        <Modal isOpen={true}>
          Get ready to play, the game is starting shortly
        </Modal>
      : null
      }
      {!this.state.isSearching && !this.state.isRoomReady ?
        <React.Fragment>
          <div className="Lobby-main">
            <div className="Lobby-main__userInfo">
              <div className="Lobby-main__pastggames___stats">
                Welcome back, {this.state.userInfo.username}
              </div>
              <div className="Lobby-main__pastggames___stats">
                Your rating is: {this.state.userInfo.rating}
              </div>
              <div className="Lobby-main__pastggames___stats">
                Games played: {this.state.userInfo.wins + this.state.userInfo.losses}, {this.state.userInfo.wins || 0} wins ({parseInt(this.state.userInfo.wins*100/(this.state.userInfo.wins+this.state.userInfo.losses),10)}%)
              </div>
              <div className="Lobby-main__pastggames___stats" style={{fontSize:"14px"}}>
                Last login: {moment(this.state.userInfo.lastLogin).format('MMMM Do YYYY, h:mm:ss a')}
              </div>
            </div>
            <div className="Lobby-main__playbutton">
              <button onClick={this.handlePlayRanked} className="playButton" >Play ranked game</button>
              <button onClick={this.handlePlay} className="playButton" >Play normal game</button>
              <button onClick={this.handleLogout} className="playButton" >Logout</button>
            </div>
          </div>
          <div className="Lobby-main__pastggames">
              Past games:
              <div className="Lobby-main__pastggames___list">
                <ul>
                  {
                    this.state.pastGames.map((G,k) => {
                      return <li key={`k${k}`} 
                        className={Boolean(G.didIwin)?"winner":"loser"}>
                          {moment(G.played).format('MMMM Do YYYY, h:mm a')}, 
                          {G.winner}
                          {G.gameType === 'ranked' ? `(Ranked ${G.ratingChange})` : ''}
                        </li>
                    })
                  }
                </ul>
              </div>
            </div>
        </React.Fragment>
         : null
      }
      </div>
    );
  }
}

export default Lobby;
