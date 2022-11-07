import React, { Component } from 'react';
import './Register.css';
const axios = require('axios');

class Register extends Component {

  constructor(props) {
    super(props);

    this.onUsernameChange = this.onUsernameChange.bind(this);
    this.onPasswordChange = this.onPasswordChange.bind(this);
    this.onEmailChange = this.onEmailChange.bind(this);
    this.onTacChange = this.onTacChange.bind(this);
    this.handleRegister = this.handleRegister.bind(this);
    this.handleBack = this.handleBack.bind(this);
    this.APIRegister = this.APIRegister.bind(this);

    this.state = {
      username: '',
      password: '',
      email: '',
      tac: false,
      flashMessage: '',
      isModalOpen: true,
    };
  }

  onTacChange(e) {
    this.setState({
      tac : e.currentTarget.checked
    })
  }

  onUsernameChange(e) {
    this.setState({
      username : e.currentTarget.value
    })
  }

  onEmailChange(e) {
    this.setState({
      email : e.currentTarget.value
    })
  }

  onPasswordChange(e) {
    this.setState({
      password : e.currentTarget.value
    })
  }

  handleBack(e) {
    this.props.history.push('/login');
  }

  handleRegister(e) {
    if (process.env.REACT_APP_REGISTRATION === 'on') {
      if (this.state.tac) {
        if (
          this.state.username.length > 0 &&
          this.state.password.length > 0 &&
          this.state.email.length > 0
          ) {
            this.setState({
              isRegistering: true,
            });
            this.APIRegister(this.state.username, this.state.password, this.state.email);  
          } else {
            this.setState({
              flashMessage: 'Please make sure all the fields are not empty'
            })
          }
      } else {
        this.setState({
          flashMessage: 'Please read and accept the not existent T&C',
        });
      }
    }
  }

  APIRegister(username, password, email) {
    if (process.env.REACT_APP_REGISTRATION === 'on') {
      axios.post(`${process.env.REACT_APP_API_ENDPOINT}/register`, {
        username,
        password,
        email,
      })
        .then(result => {
          localStorage.setItem('token',result.data.token);
          setInterval(()=> {
            this.props.history.push('/lobby');
          },1500);
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
  }

  render() {
    return (
      <div className="Register">
      {this.state.flashMessage !== '' ? 
        <div className="Register-flashMessage">
          {this.state.flashMessage}
        </div>
      :null}
      {(!this.state.isRegistering && !this.state.isLoggingIn) ? 
        <React.Fragment>
          <div className="Register-inputContainer">
            <div className="Register-inputs">
              <input className="Register-input" placeholder="Username" type="text" onChange={this.onUsernameChange} value={this.state.username} />
            </div>
            <div className="Register-inputs">
              <input className="Register-input" placeholder="Email" type="text" onChange={this.onEmailChange} value={this.state.email} />
            </div>
            <div className="Register-inputs">
              <input className="Register-input" placeholder="Password" type="password" onChange={this.onPasswordChange}  value={this.state.password} />
            </div>
            <div className="Register-inputs">
              T&C <input className="Register-input" type="checkbox" onChange={this.onTacChange} value={this.state.tac} />
            </div>
          </div>
          <div className="Register-buttons">
            { (process.env.REACT_APP_REGISTRATION === 'on') ?
                <button className="Register-button" onClick={this.handleRegister}> Sign up </button>
                : null
            }
            <button className="Register-button" onClick={this.handleBack}> Back </button>
          </div>
        </React.Fragment>
      : null}
      {this.state.isRegistering?
        <p>Registration happening, wait a second</p>
      :null}
      </div>
    );
  }
}

export default Register;
