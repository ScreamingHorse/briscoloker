import React, { Component } from 'react';
import './Game.css';
import Card from './Card/Card';
import Deck from './Deck/Deck';
import Board from './Board/Board';

class Game extends Component {

  constructor(props) {
    super(props);
    this.resolveHand = this.resolveHand.bind(this);
    this.playAHeroCard = this.playAHeroCard.bind(this);
    this.heroBetting = this.heroBetting.bind(this);
    this.villanBetting = this.villanBetting.bind(this);
    this.heroFolding = this.heroFolding.bind(this);
    this.villanFolding = this.villanFolding.bind(this);

    /**
     * Values of the cards 1 -> 10
     * 1: Ace
     * 3: Three
     * 8: Jack
     * 9: Knight (or Queen)
     * 10: King
     * 
     * Suits 0 -> 3
     * 0: Hearts
     * 1: Spades
     * 2: Clubs
     * 3: Diamonds
     */
    let token = localStorage.getItem('token');
    this.state = {
      token : token,
      isGameFinished : false,
      gameWinner: '',
      currentHand: {
        roundLeader : '',
        initiative : '',
        isBettingPhase: true,
        isFolded: false,
        bettingRound: 0,
        pot : 0,
        heroBets : 0,
        villanBets : 0,
        hasHeroPlayed : false,
        hasVillanPlayed : false,
        winner : null,
      },
      sideBet : 0,
      winnerOfTheWholeThing : null,
      hero: {
        cardsCaptured: [],
        hand: [],
        score : 0,
        chips : 100,
      },
      villan: {
        cardsCaptured: [],
        hand: [],
        score : 0,
        chips : 100,
        name : '',
      },
      deck:[],
      trumpCard: {},
      board: {
        playedCards: {
          hero: null,
          villan: null,
        },
        discardedCards : []
      },
    };
    //Tell the socket server that the game UI is ready
    window.socket.emit('table_ready',{ token });
    //All the topic we are listeing
    //This topic is used to receive the state of the game from the server
    window.socket.on('game_state',(data) => {
      console.log('Message received from game state', data);
      if (data.result === false) {
        //there is no game for you bro
        this.props.history.push('/lobby');
      } else {
        //I don't care abou the state of the client,
        //because when the server send the game state
        //is it the TRUTH
        //server is 100% authoritative
        //debugger;
        let villan = this.state.villan;
        let hero = this.state.hero;

        let remoteVillan = data.result.villan;
        let remoteHero = data.result.hero;
        let remoteCurrentHand = data.result.currentHand
        
        villan.name = remoteVillan.name;
        villan.cardsCaptured = remoteVillan.cardsCaptured;
        villan.hand = [];
        villan.score = remoteVillan.score;
        villan.chips = remoteVillan.chips;

        hero.cardsCaptured = remoteHero.cardsCaptured;
        hero.hand = remoteHero.hand;
        hero.score = remoteHero.score;
        hero.chips = remoteHero.chips;
        hero.initiative = remoteHero.initiative;
        hero.roundLeader = remoteHero.roundLeader;

        let trumpCard = data.result.trumpCard;
        let cardLeft = data.result.deck.cardLeft;

        let currentHand = Object.assign({}, this.state.currentHand);
        currentHand.roundLeader = hero.roundLeader?'hero':'villan';
        currentHand.initiative = hero.initiative?'hero':'villan';
        //debugger
        currentHand.heroBets = remoteHero.currentHand.bets;
        currentHand.villanBets = remoteVillan.currentHand.bets;
        currentHand.pot = remoteCurrentHand.pot;
        currentHand.bettingRound = remoteCurrentHand.bettingRound;
        currentHand.isBettingPhase = remoteCurrentHand.isBettingPhase;
        let board = Object.assign({}, this.state.board);
        board = {
          playedCards: {
            hero: remoteHero.currentHand.playedCard,
            villan: remoteVillan.currentHand.playedCard,
          },
          discardedCards : []
        };

        this.setState({
          villan,
          hero,
          trumpCard,
          cardLeft,
          currentHand,
          board,
        })
      }
    });
    //Try to reconnect to a game using the auth token
    window.socket.on('connect', () => {
      //Check if I have a game ready
      let token = localStorage.getItem('token');
      if (token !== null) {
        window.socket.emit('reconnect_me',{ token });
        window.socket.emit('table_ready',{ token });
      } else {
        this.props.history.push('/');
      }
    });
  }

  /**
   * this resolve the hand
   *  - Step 1: check if any of the card is the trump
   *  - Step 2: 
   *    If one of the card is a trump, this card win
   *    If there is not trump or both are trump, the higest value win
   */
  resolveHand() {
    //debugger
    let board = Object.assign({},this.state.board);
    let hero = Object.assign({}, this.state.hero);
    let villan = Object.assign({}, this.state.villan);
    let deck = Object.assign([], this.state.deck);
    let trumpCard = Object.assign({}, this.state.trumpCard);
    let currentHand = Object.assign({}, this.state.currentHand);
    let isGameFinished = false;
    let gameWinner = '';
    let winnerOfTheWholeThing = null;
    let winner = 'hero';
    /**
     * array that contains the actual value of the cards
     * Map value:
     * Ace -> INDEX 0 -> VALUE 12
     * 2 -> 1 -> VALUE 2
     * 3 -> 2 -> 11
     * 4 to 10 are mapped as they are
     */
    let valueMapper = [12,2,11,4,5,6,7,8,9,10];
    /**
     * Array that contains the points for each face value of the cards
     * Map value:
     * Ace -> 11
     * 2 -> 0
     * 3 -> 10
     * 4 to 7 -> 0
     * 8 -> 2
     * 9 -> 3
     * 10 -> 4
     */
    let scoreMapper = [11,0,10,0,0,0,0,2,3,4];
    //the hand is not folded
    if (!currentHand.isFolded) {
      let heroCard = this.state.board.playedCards.hero;
      let villanCard = this.state.board.playedCards.villan;
      //check if any of the card is a Trump
      heroCard.isTrump = (heroCard.suit === trumpCard.suit);
      villanCard.isTrump = (villanCard.suit === trumpCard.suit);
      //check if no trump
      if (!heroCard.isTrump && !villanCard.isTrump) {
        //no one played a Trump card
        //check if the 2 cards have the same suit
        if (heroCard.suit === villanCard.suit) {
          //the cards are from the same suit
          //the higest wins
          if (valueMapper[heroCard.value-1] > valueMapper[villanCard.value-1]) {
            winner = 'hero';
          } else {
            winner = 'villan';
          }
        } else {
          //the cards are not from the same suit
          //the leader wins
          if (currentHand.roundLeader === 'hero') {
            winner = 'hero';
          } else {
            winner = 'villan';
          }
        }
      } else if ((heroCard.isTrump && villanCard.isTrump)) {
        //2 trumps 
        //check the card with higher face value
        if (valueMapper[heroCard.value-1] > valueMapper[villanCard.value-1]) {
          winner = 'hero';
        } else {
          winner = 'villan';
        }
      } else {
        // 1 trumps
        if (heroCard.isTrump) {
          winner = 'hero';
        } else {
          winner = 'villan';
        }
      }
      //add the card to the captured card
      if(winner === 'hero') {
        hero.cardsCaptured.push(heroCard);
        hero.cardsCaptured.push(villanCard);
        //adding the pot to the hero bank
        hero.chips += currentHand.pot;
      } else {
        villan.cardsCaptured.push(heroCard);
        villan.cardsCaptured.push(villanCard);
        //adding the pot to the villan account
        villan.chips += currentHand.pot;
      }
      board.playedCards.hero = null;
      board.playedCards.villan = null;
      //calculating the current score for the villan
      let score = 0;
      villan.cardsCaptured.forEach(C => {
        score += scoreMapper[C.value -1]
      });
      villan.score = score;
      score = 0;
      //calculating the current score for the hero
      hero.cardsCaptured.forEach(C => {
        score += scoreMapper[C.value -1]
      });
      hero.score = score;
      //check if the game is finished
      //debugger;
    } else {
      //the hand is folded
      winner = currentHand.winner;
    }
    //picking the new card
    if(winner === 'hero') {
      //Pick a new card for each one Hero goes first);
      //Pick the cards only if there are cards!!
      if (deck.length > 0) {
        hero.hand.push(deck.pop());
        if (deck.length === 0) {
          //debugger;
          //no card left use trump
          villan.hand.push({value: trumpCard.value, suit: trumpCard.suit});
          //trumpCard = {};
        } else {
          villan.hand.push(deck.pop());
        }
      }
    } else {
      //Pick a new card for each one Villan goes first);
      //only if the deck is not empty, broooo!
      if (deck.length > 0) {
        villan.hand.push(deck.pop());
        if (deck.length === 0) {
          //no card left use trump
          hero.hand.push({value: trumpCard.value, suit: trumpCard.suit});
          //trumpCard = {};
        } else {
          hero.hand.push(deck.pop());
        }
      }
    }
    //check if the game is still on
    if ((villan.cardsCaptured.length + hero.cardsCaptured.length + board.discardedCards.length) === 40) {
      //debugger;
      isGameFinished = true;
      //assign the sideBet
      if (hero.score === villan.score) {
        //it's a tie!!!!
        hero.chips += this.state.sideBet;
        villan.chips += this.state.sideBet;
        gameWinner = 'This round was a tie!';
      } else if (hero.score > villan.score) {
        //hero won
        hero.chips += this.state.sideBet * 2;
        if (villan.chips === 0) {
          winnerOfTheWholeThing = 'hero';
        }
        gameWinner = 'The winner is HERO!';
      } else {
        //villan won
        villan.chips += this.state.sideBet * 2;
        if (hero.chips === 0) {
          winnerOfTheWholeThing = 'villan';
        }
        gameWinner = 'the Villan won the round!';
      }
    }
    //check if both of the player have money, if not the betting phase is skipped
    //debugger
    let bettingPhase = true;
    if (hero.chips === 0 || villan.chips === 0) {
      bettingPhase = false;
    }
    currentHand = {
      initiative: winner,
      roundLeader: winner,
      villanBets : 0,
      heroBets:0,
      bettingRound: 0,
      isBettingPhase: bettingPhase,
      isFolded: false,
      pot:0,
      hasHeroPlayed : false,
      hasVillanPlayed : false,
      winner : null,
    }
    this.setState({
      board,
      hero,
      villan,
      deck,
      trumpCard,
      isGameFinished,
      currentHand,
      winnerOfTheWholeThing,
      gameWinner,
    })
  }

  /**
   * Plays a card for the hero
   */
  playAHeroCard (value, suit) {
    //Tell the socket server the card to play
    window.socket.emit('play_a_card',{ 
      token : this.state.token,
      card : {
        value,
        suit,
      }
    });
  }

  heroBetting(bet) {
    //The betting round finishes when he put into the pot the same amount of money of the other one
    //debugger
    //Tell the socket server that the game UI is ready
    window.socket.emit('betting',{ 
      token : this.state.token,
      bet : bet
    });
  }
  
  villanFolding() {
    //the villan is folding: 
    let hero = Object.assign({},this.state.hero);
    let currentHand = Object.assign({},this.state.currentHand);
    //1. so the hero get all the money in the pot
    hero.chips += currentHand.pot;
    //2. mark the hand as folded
    currentHand.isFolded = true;
    currentHand.isBettingPhase = false;
    //3. give away initiative
    currentHand.initiative = 'villan';
    //4. hero win the hand
    currentHand.winner = 'hero';
    this.setState({
      currentHand,
      hero,
    });
  }

  heroFolding() {
    //debugger
    //the hero is folding: 
    let villan = Object.assign({},this.state.villan);
    let currentHand = Object.assign({},this.state.currentHand);
    //1. so the hero get all the money in the pot
    villan.chips += currentHand.pot;
    //2. mark the hand as folded
    currentHand.isFolded = true;
    currentHand.isBettingPhase = false;
    //3. give away initiative
    currentHand.initiative = 'hero';
    //4. villan win the hand
    currentHand.winner = 'villan';
    this.setState({
      currentHand,
      villan,
    });
  }

  villanBetting(bet) {
    //debugger
    let villan = Object.assign({},this.state.villan);
    let hero = Object.assign({},this.state.hero);
    let currentHand = Object.assign({},this.state.currentHand);
    //1. need to check if the villan has the money to bet
    //   if not it is an all in
    if (villan.chips < bet) {
      //debugger
      //1. Calculate the difference to the villan
      let overBet = bet - villan.chips;
      //2. size the bet to all the villans's money
      bet = villan.chips;
      //3. if the new bet covers what hero put into the pot
      if ((currentHand.villanBets + bet) < currentHand.heroBets) {
        //4.Hero is betting less then what villan did,
        //meaning that he is calling an all in
        hero.chips += overBet;
        //4.update the current bet of the hero and the pot
        currentHand.heroBets -= overBet;
        currentHand.pot -= overBet;
      }
    } else {
      //hero is without money, he is all in some how
      //if he put more money on the pot, need to match
      //I assume an overbet by the villan
      if (hero.chips === 0 && currentHand.heroBets >= currentHand.villanBets) {
        //need to resize the her bet
        bet = currentHand.heroBets - currentHand.villanBets;
      }
    }
    //2. spend the villan money
    villan.chips -= bet;
    currentHand.pot += bet;
    currentHand.villanBets +=bet;
    //3. give away the initiave 
    currentHand.initiative = 'hero';
    //4. check if the betting round is over
    if (currentHand.villanBets === currentHand.heroBets && !(currentHand.bettingRound ===0)) {
      currentHand.isBettingPhase = false;
      //if the round ends, villan get the card initiave
      //currentHand.initiative = 'villan';
    }
    //5. bump the betting round
    currentHand.bettingRound ++;
    //6. Check if the hero still have money
    //if (villan.chips === 0) {
      //no money = no more bets
    //  currentHand.isBettingPhase = false;
    //}
    //check if hero has still anything left
    //if not end the betting phase
    if (hero.chips === 0) {
      currentHand.bettingPhase = false;
    }
    this.setState({
      villan,
      currentHand,
      hero,
    })
  }

  isMyBettingInitiative(player) {
    //debugger;
    //console.log("Checking in for ", player);
    //check if the cards are already on the board
    //this.state.initiative is always 'hero' or 'villan'
    return (this.state.currentHand.initiative === player && this.state.currentHand.isBettingPhase && !this.state.isGameFinished)
  }

  isMyCardInitiative(player) {
    //debugger;
    //console.log("Checking in for ", player);
    //check if the cards are already on the board
    //this.state.initiative is always 'hero' or 'villan'
    return (this.state.board.playedCards[player]===null && this.state.currentHand.initiative === player && !this.state.currentHand.isBettingPhase)
  }

  render() {
    const villanBettingDifference = this.state.currentHand.heroBets - this.state.currentHand.villanBets;
    const heroBettingDifference = this.state.currentHand.villanBets - this.state.currentHand.heroBets;
    return (
      <div className="Game">
        <section className="Game-Board">
          <div className="Game-villanCards">
            <div className="Game-villanCaptureCards">
              {
                this.state.villan.cardsCaptured.map((C,i) => {
                  return <Card
                    key={`villan-cc-${i}`}
                    value={C.value}
                    suit={C.suit}
                  />
                })
              }
            </div>
            <div className="Game-villanStuff">
              <div className="Game-villanStuff__villanStats">
                  Opponent name: {this.state.villan.name} <br />
                  Chips: {this.state.villan.chips} <br />
              </div>
            </div>
          </div>
          <div className="Game-middleSection">
            <div className="Game-middleSection__rubbishBin">
              {
                  this.state.board.discardedCards.map((C,i) => {
                    return <Card 
                      key={`discarded-cc-${i}`}
                      value={C.value}
                      suit={C.suit}
                    />
                  })
                }
            </div>
            <Deck 
              trumpCard = {this.state.trumpCard}
              deck = {this.state.deck}
              cardLeft = {this.state.cardLeft}
            />
            <Board 
              board = {this.state.board}
              winnerOfTheWholeThing = {this.state.winnerOfTheWholeThing}
            />
            <div className="Game-middleSection__commonActions">
              <button onClick={this.newGame}>Start a new game</button>
              <div>{`Round leader ${this.state.currentHand.roundLeader}`}</div>
              <div>{`Initiative ${this.state.currentHand.initiative}`}</div>
              <div>{`isBettingPhase ${this.state.currentHand.isBettingPhase.toString()}`}</div>
              <div className="Game-middleSection__commonActions___handPot">
                Bets: <br />
                Opp: {this.state.currentHand.villanBets} <br />
                Hero: {this.state.currentHand.heroBets} <br />
                Total hand: {this.state.currentHand.pot} <br />
              </div>
              <div className="Game-middleSection__commonActions___endScreen">
                Score: <br />
                Opp: {this.state.villan.score} <br />
                Hero: {this.state.hero.score} <br />
                Side bet: {this.state.sideBet * 2} <br />
                {this.state.isGameFinished ?
                  <React.Fragment>
                    {this.state.gameWinner}
                  </React.Fragment>
                : null }
              </div>
            </div>
          </div>
          <div className="Game-heroCards">
            <div className="Game-heroCaptureCards">
              {
                this.state.hero.cardsCaptured.map((C,i) => {
                  return <Card 
                    key={`hero-cc-${i}`}
                    value={C.value}
                    suit={C.suit}
                  />
                })
              }
            </div>
            <div className="Game-heroHand">
              {
                this.state.hero.hand.map((C,i) => {
                  return <Card 
                    key={`hero-h-${i}`}
                    value={C.value}
                    suit={C.suit}
                    buttonText={this.state.currentHand.isFolded?`Discard me`:`Play me!`}
                    onPlay={this.isMyCardInitiative('hero')?this.playAHeroCard:null}
                  />
                })
              }
            </div>
            <div className="Game-heroStuff">
              <div className="Game-heroStuff__heroBets">
                {this.isMyBettingInitiative('hero')?
                  this.state.currentHand.bettingRound === 0 ?
                    <React.Fragment> 
                      <button onClick={() => {this.heroBetting(0)}}>Check</button>
                      <button onClick={() => {this.heroBetting(10)}}>Bet 10</button>
                    </React.Fragment> :
                    <React.Fragment>
                      <button onClick={() => {this.heroBetting(heroBettingDifference)}}>Call {heroBettingDifference}</button>
                      <button onClick={() => {this.heroBetting(heroBettingDifference+10)}}>Raise {heroBettingDifference +10}</button>
                      <button onClick={() => {this.heroBetting(heroBettingDifference+30)}}>Raise ({heroBettingDifference +30})</button>
                      <button onClick={() => {this.heroFolding()}}>Fold</button>
                    </React.Fragment>
                  : null }
                </div>
                <div className="Game-heroStuff__heroStats">
                    Hero chips: {this.state.hero.chips} <br />
                </div>
            </div>
          </div>
        </section>
      </div>
    );
  }
}

export default Game;
