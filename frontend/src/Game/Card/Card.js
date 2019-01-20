import React, { Component } from 'react';
import './Card.css';

class Card extends Component {
    /**
     * Values of the cards 1 -> 10
     * 1: Ace
     * 3: Three
     * 8: Jack
     * 9: Knight (or Queen)
     * 10: King
     * 
     * Suits 0 -> 3
     * 0: Hearts / Bastoni - 
     * 1: Spades / Coppe -
     * 2: Clubs / Denari -
     * 3: Diamonds / Spade -
     */

  get getValue() {
    let valueName;
    switch (this.props.value) {
      case 1: valueName = "Ace"; break;
      case 10: valueName = "King"; break;
      case 9: valueName = "Queen"; break;
      case 8: valueName = "Jack"; break;
      default : valueName = this.props.value;
    }
    return <React.Fragment>{valueName}</React.Fragment>
  }
  get getSuit() {
    let suitName;
    switch (this.props.suit) {
      case 0: suitName = "Hearts"; break;
      case 1: suitName = "Spades"; break;
      case 2: suitName = "Clubs"; break;
      case 3: suitName = "Diamonds"; break;
      default : suitName = "";
    }
    return <React.Fragment>{suitName}</React.Fragment>
  }

  render() {
    const buttonText = this.props.buttonText ? this.props.buttonText : 'Play me!';
    return (
      <div className="Card" style={{
        backgroundPositionY : -1 - 100 * parseInt(this.props.suit),
        backgroundPositionX : - 62 * (parseInt(this.props.value) - 1),
      }}>
        {this.props.onPlay ?
          <button onClick={() => {this.props.onPlay(this.props.value, this.props.suit)}}>{buttonText}</button>
          : null
        }
      </div>
    );
  }
}

export default Card;
