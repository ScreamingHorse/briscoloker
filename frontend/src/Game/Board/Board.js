import React, { Component } from 'react';
import './Board.css';
import Card from '../Card/Card';
/**
 * Structure of the board object
      {
        playedCards: { [The cards in play at the moment]
          hero: {value: 5, suit: 2 },
          villan: {value: 3, suit: 1},
        }
      }
 */
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
          </React.Fragment>
        }
      </div>
    );
  }
}

export default Board;
