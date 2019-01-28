import React, { Component } from 'react';
import './CapturedCards.css';
import Card from '../Card/Card';

class CapturedCards extends Component {

  render() {
    return (
      <div className="Game-middleSection__commonActions">
        <div className="Game-middleSection__villanStats">
            Opponent name: {this.props.villan.name} <br />
            Chips: {this.props.villan.chips} <br />
        </div>
        <div className="Game-villanCaptureCards">
        { this.props.isTheRoundFinished ? null :
          this.props.villan.cardsCaptured.map((C,i) => {
            return <Card
              key={`villan-cc-${i}`}
              value={C.value}
              suit={C.suit}
            />
          })
        }
        </div>
        <div className="Game-heroCaptureCards">
          { this.props.isTheRoundFinished ? null :
            this.props.hero.cardsCaptured.map((C,i) => {
              return <Card 
                key={`hero-cc-${i}`}
                value={C.value}
                suit={C.suit}
              />
            })
          }
        </div>
        <div className="Game-heroStuff__heroStats">
          Hero chips: {this.props.hero.chips} <br />
        </div>
      </div>
    );
  }
}

export default CapturedCards;
