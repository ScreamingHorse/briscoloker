import React, { Component } from 'react';
import './Login.css';
import {API_ENDPOINT, WEBSOCKET_SERVER} from '../config';
import Io from 'socket.io-client';
const axios = require('axios');

class Login extends Component {

  constructor(props) {
    super(props);

    this.onUsernameChange = this.onUsernameChange.bind(this);
    this.onPasswordChange = this.onPasswordChange.bind(this);
    this.handleLogin = this.handleLogin.bind(this);
    this.handleRegister = this.handleRegister.bind(this);
    this.APIRegister = this.APIRegister.bind(this);
    this.APILogin = this.APILogin.bind(this);

    this.state = {
      username : '',
      password : '',
      flashMessage : '',
    };
  }

  onUsernameChange(e) {
    this.setState({
      username : e.currentTarget.value
    })
  }

  onPasswordChange(e) {
    this.setState({
      password : e.currentTarget.value
    })
  }

  handleLogin(e) {
    this.setState({
      isLoggingIn: true,
    });
    this.APILogin(this.state.username,this.state.password);
  }

  handleRegister(e) {
    this.setState({
      isRegistering: true,
    });
    this.APIRegister(this.state.username,this.state.password);
  }

  APILogin(username, password) {
    axios.post(`${API_ENDPOINT}/login`, {
      username,
      password
    })
      .then(result => {
        localStorage.setItem('token',result.data.token);
        //CREATE THE SOCKET SERVER
        //I create the socket.io client on window so I can access it everywhere
        //if (!window.socket) {
        let token = localStorage.getItem('token');
        window.socket= Io(WEBSOCKET_SERVER, {query: `token=${token}`});
        //}
        window.socket.on('disconnect', () => {
          console.log("I am disconnected")
        });
        setInterval(()=> {
          // not using the router because it creates some problem after the first load
          // this.props.history.push('/lobby');
          window.location.assign('/lobby');
        },2500);
        this.setState({
          isLoggingIn : false,
          flashMessage : 'You are logged in, you\'ll be redirected to the lobby soon',
        })
      })
      .catch(e => {
        this.setState({
          isLoggingIn : false,
          flashMessage : 'Unable to log you in. Fix you problems and try again',
        })
      })
  }

  APIRegister(username, password) {
    axios.post(`${API_ENDPOINT}/register`, {
      username,
      password
    })
      .then(result => {
        localStorage.setItem('token',result.data.token);
        setInterval(()=> {
          this.props.history.push('/lobby');
        },2500);
        this.setState({
          isRegistering : false,
          flashMessage : 'Registration OK, you\'ll be redirected to the lobby soon',
        })
      })
      .catch(e => {
        this.setState({
          isRegistering : false,
          flashMessage : 'Something went horribly wrong. Try again!',
        })
      })
  }

  render() {
    return (
      <div className="Login">
      {this.state.flashMessage !== '' ? 
        <div className="Login-flashMessage">
          {this.state.flashMessage}
        </div>
      :null}
      {(!this.state.isRegistering && !this.state.isLoggingIn) ? 
        <React.Fragment>
          <div className="Login-inputs">
            Login : <input type="text" onChange={this.onUsernameChange} value={this.state.username} />
            Password: <input type="password" onChange={this.onPasswordChange}  value={this.state.password} />
          </div>
          <div className="Login-buttons">
            <button onClick={this.handleLogin}> Login </button>
            <button onClick={this.handleRegister}> Register instead </button>
          </div>
        </React.Fragment>
      : null}
      {this.state.isRegistering?
        <p>Registration happening</p>
      :null}
      {this.state.isLoggingIn?
        <p>Verifing your login</p>
      :null}
      </div>
    );
  }
}

export default Login;
