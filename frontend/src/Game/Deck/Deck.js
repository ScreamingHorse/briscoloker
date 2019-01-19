import React, { Component } from 'react';
import './Deck.css';
import Card from '../Card/Card';

/**
 * It receive 2 object.
 * trumpCard : {
 *  value: [1..10]
 *  suit: [0-3]
 * }
 * deck: [] <- remainig cards
 */
class Deck extends Component {
  render() {
    return (
      <div className="Deck">
        <div className="Deck-ActualDeck">
          Card left {this.props.deck.length}
        </div>
        <Card 
          value={this.props.trumpCard.value}
          suit={this.props.trumpCard.suit}
        />
      </div>
    );
  }
}

export default Deck;
