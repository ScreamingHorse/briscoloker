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
    let villanCards = [];
    for (var idx = 0; idx < this.props.villanCardsInHand; idx ++) {
      villanCards.push(true);
    }
    return <React.Fragment>
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
              buttonText={this.props.isFolded?`Discard me`:`Play me!`}
              onPlay={this.props.isMyCardInitiative?this.props.playAHeroCard:null}
            />
          })
        }
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
