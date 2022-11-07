import React, { Component } from 'react';
import './Board.css';
import Card from '../Card/Card';
import { Link } from "react-router-dom";

class Board extends Component {

  endGameCard = () => {
    return (
      <React.Fragment>
        <div className="Board-endGameCard">
          THE WINNER OF THEM ALL IS: {this.props.winnerOfTheWholeThing} <br />
          Go back to the <Link to="/lobby">lobby</Link> for more games!
        </div>
        
      </React.Fragment>
    )};
  
  endOfRoundCard = () => { 
    return (
    <div className="Board-endOfRoundCard">
      Round finished, {this.props.lastRoundWinner.toLowerCase()} <br />
      Next round will start in few seconds, make yourself ready!!
    </div>
    )
  }

  theBoard = () => {
    let chatMessage = this.props.chatMessage;
    switch (this.props.chatMessage) {
      case 'wp':
        chatMessage = 'Well played';
      break;
      case 'gg':
        chatMessage = 'Good Game';
      break;
      case 'ez':
        chatMessage = 'This game was too easy!';
      break;
      case 'hello':
        chatMessage = 'It\'s my pleasure to compete against you m\'lady'; 
      break;
      default:
        chatMessage = this.props.chatMessage;
    }
    let villanCards = [];
    for (var idx = 0; idx < this.props.villanCardsInHand; idx ++) {
      villanCards.push(true);
    }
    return <React.Fragment>
    <div className="Game-middleSection__villanStats">
      {this.props.villan.name} : {this.props.villan.chips}
    </div>
    {chatMessage!==null ? <div className="Board-chatBubble">Says {chatMessage}</div> : null }
    <div className="Game-heroHand">
      {
        villanCards.map((t,idx) => {
          return <div key={`card_${idx}`} className="Board-villanHand"></div>
        })
      }
    </div>
    <div className="Board-playedCards">
      {this.props.board.playedCards.villan !== null ?
        <Card 
          value={this.props.board.playedCards.villan.value}
          suit={this.props.board.playedCards.villan.suit}
        />
      :null }
      {this.props.board.playedCards.hero !== null ?
        <Card 
          value={this.props.board.playedCards.hero.value}
          suit={this.props.board.playedCards.hero.suit}
        />
      :null }
    </div>
      <div className="Game-heroHand">
        {
          this.props.heroHand.map((C,i) => {
            return <Card 
              key={`hero-h-${i}`}
              value={C.value}
              suit={C.suit}
              buttonText={this.props.isFolded?`Discard`:`Play`}
              onPlay={this.props.isMyCardInitiative?this.props.playAHeroCard:null}
            />
          })
        }
      </div>
      <div className="Game-heroStuff__heroStats">
        {this.props.hero.name} : {this.props.hero.chips}
        <div className="Game-chatButtons">
          <button onClick={e => {this.props.sendChatMessage('hello')}}>Hello</button>
          <button onClick={e => {this.props.sendChatMessage('wp')}}>Well Played</button>
          <button onClick={e => {this.props.sendChatMessage('gg')}}>Good Game</button>
          <button onClick={e => {this.props.sendChatMessage('ez')}}>Easy nooob!</button>
        </div>
      </div>
    </React.Fragment>
  }

  render() {
    return (
      <div className="Board">
        {this.props.isTheGameFinished === true ?
          this.endGameCard()
        : this.props.isTheRoundFinished === true ?
          this.endOfRoundCard()
          :
         this.theBoard()
        }
      </div>
    );
  }
}

export default Board;
