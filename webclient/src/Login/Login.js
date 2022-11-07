import React, { Component } from 'react';
import './Login.css';
import Io from 'socket.io-client';
const axios = require('axios');


class Login extends Component {

  constructor(props) {
    super(props);

    this.onUsernameChange = this.onUsernameChange.bind(this);
    this.onPasswordChange = this.onPasswordChange.bind(this);
    this.handleLogin = this.handleLogin.bind(this);
    this.handleRegister = this.handleRegister.bind(this);
    this.APILogin = this.APILogin.bind(this);

    this.state = {
      username : '',
      password : '',
      flashMessage : '',
      isModalOpen : true,
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
    this.props.history.push('/register');
  }

  APILogin(username, password) {
    axios.post(`${process.env.REACT_APP_API_ENDPOINT}/login`, {
      username,
      password
    })
      .then(result => {
        localStorage.setItem('token',result.data.token);
        //CREATE THE SOCKET SERVER
        //I create the socket.io client on window so I can access it everywhere
        //if (!window.socket) {
        let token = localStorage.getItem('token');
        window.socket= Io(process.env.REACT_APP_WEBSOCKET_SERVER, {query: `token=${token}`});
        //}
        setInterval(()=> {
          // not using the router because it creates some problem after the first load
          // this.props.history.push('/lobby');
          window.location.assign('/lobby');
        },1500);
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
            <div className="Login-inputs__buttonContainer">
              <input className="Login-input" type="text" placeholder="Username or email" onChange={this.onUsernameChange} value={this.state.username} />
            </div>
            <div className="Login-inputs__buttonContainer">
              <input className="Login-input" type="password" placeholder="Password" onChange={this.onPasswordChange}  value={this.state.password} />
            </div>
          </div>
          <div className="Login-buttons">
            <button onClick={this.handleLogin}> Login </button>
            { (process.env.REACT_APP_REGISTRATION === 'on') ?
                <button onClick={this.handleRegister}> Register instead </button>
                : null
            }
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
