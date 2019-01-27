import React, { Component } from 'react';
import './Board.css';
import Card from '../Card/Card';

class Board extends Component {
  render() {
    //console.log(this.props);
    return (
      <div className="Board">
        {this.props.winnerOfTheWholeThing !== null?
          <React.Fragment>
            THE WINNER OF THEM ALL IS: {this.props.winnerOfTheWholeThing}
          </React.Fragment>
        : <React.Fragment>
          <div className="Game-heroHand">
            <div className="Board-villanHand">
            </div>
            <div className="Board-villanHand">
            </div>
            <div className="Board-villanHand">
            </div>
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
      </div>
    );
  }
}

export default Board;
