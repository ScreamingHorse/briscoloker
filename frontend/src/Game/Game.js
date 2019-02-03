import React, { Component } from 'react';
import './Game.css';
import Deck from './Deck/Deck';
import Board from './Board/Board';
import CapturedCards from './CapturedCards/CapturedCards';
import { Link } from "react-router-dom";
class Game extends Component {

  constructor(props) {
    super(props);
    this.playAHeroCard = this.playAHeroCard.bind(this);
    this.heroBetting = this.heroBetting.bind(this);
    this.heroFolding = this.heroFolding.bind(this);

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
      logs : [],
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
        discardedCards : [],
      },
      gameState: {},
    };
    //Tell the socket server that the game UI is ready
    window.socket.emit('table_ready',{ token });
    //All the topic we are listeing
    //This topic is used to receive the state of the game from the server
    window.socket.on('game_state',(data) => {
      //debugger
      console.log('Message received from game state', data.result);
      if (data.result === false) {
        //debugger
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
        villan.cardsInHand = remoteVillan.cardsInHand;

        hero.name = remoteHero.name;
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
        currentHand.isFolded = remoteCurrentHand.isFolded;
        let board = Object.assign({}, this.state.board);
        board = {
          playedCards: {
            hero: remoteHero.currentHand.playedCard,
            villan: remoteVillan.currentHand.playedCard,
          },
          discardedCards : data.result.discardedCards,
        };
        let sideBet = data.result.sideBet;
        let gameState = data.result.gameState;
        let logs = data.result.logs;
        this.setState({
          logs,
          villan,
          hero,
          trumpCard,
          cardLeft,
          currentHand,
          board,
          sideBet,
          gameState,
        })
      }
    });
    //Try to reconnect to a game using the auth token
    window.socket.on('connect', () => {
      //Check if I have a game ready
      //debugger
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
  
  heroFolding() {
    //debugger
    //the hero is folding: 
    window.socket.emit('fold',{ 
      token : this.state.token,
    });
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
    const heroBettingDifference = this.state.currentHand.villanBets - this.state.currentHand.heroBets;
    return (
      <div className="Game">
        <section className="Game-Board">
          <div className="Game-middleSection">
            <Deck 
              trumpCard = {this.state.trumpCard}
              deck = {this.state.deck}
              cardLeft = {this.state.cardLeft}
              discardedCards = {this.state.board.discardedCards}
              isTheRoundFinished = {this.state.gameState.isTheRoundFinished}
              gameRound = {this.state.gameState.round}
            />
            <Board 
              board = {this.state.board}
              heroHand = {this.state.hero.hand}
              isFolded = {this.state.currentHand.isFolded}
              isMyCardInitiative = {this.isMyCardInitiative('hero')}
              playAHeroCard = {this.playAHeroCard}
              villanCardsInHand = {this.state.villan.cardsInHand}
              isTheRoundFinished = {this.state.gameState.isTheRoundFinished}
              isTheGameFinished = {this.state.gameState.isTheGameFinished}
              lastRoundWinner = {this.state.gameState.lastRoundWinner}
              winnerOfTheWholeThing = {this.state.gameState.winnerOfTheWholeThing}
              villan = {this.state.villan}
              hero = {this.state.hero}
            />
            <CapturedCards
              villan = {this.state.villan}
              hero = {this.state.hero}
              isTheRoundFinished = {this.state.gameState.isTheRoundFinished}
            />
          </div>
          <div className="Game-bottomBar">
            <div className="Game-heroStuff__bottomBar">
              {this.isMyBettingInitiative('hero')?
                this.state.currentHand.bettingRound === 0 ?
                  <React.Fragment> 
                    <button onClick={() => {this.heroBetting(0)}}>Check</button>
                    <button onClick={() => {this.heroBetting(10)}} style={{marginBottom:"30px"}}>Bet 10</button>
                  </React.Fragment> :
                  <React.Fragment>
                    <button onClick={() => {this.heroBetting(heroBettingDifference)}}>Call {heroBettingDifference}</button>
                    <button onClick={() => {this.heroBetting(heroBettingDifference+10)}}>Raise {heroBettingDifference +10}</button>
                    <button onClick={() => {this.heroBetting(heroBettingDifference+30)}}>Raise {heroBettingDifference +30}</button>
                    <button onClick={() => {this.heroFolding()}} style={{marginBottom:"5px"}}>Fold</button>
                  </React.Fragment>
                : null }
                <Link to="/lobby" className="fakeButton">Lobby</Link>
            </div>
            <div className="Game-middleSection__commonActions___handPot">
                <div>
                  Bets: <br />
                  Opp: {this.state.currentHand.villanBets} <br />
                  Hero: {this.state.currentHand.heroBets} <br />
                  Total hand: {this.state.currentHand.pot} <br />
                </div>
                <div>
                  Score: <br />
                  Opp: {this.state.villan.score} <br />
                  Hero: {this.state.hero.score} <br />
                  Side pot: {this.state.sideBet * 2} <br />
                </div>
            </div>
              <div className="Game-middleSection__commonActions___logger">
                {this.state.logs
                  .sort((L1,L2) => {
                    if (L1.time > L2.time) return -1
                      else return 1 
                  })
                  .map((L,i) => {
                  return <span key={`log_${i}`}>{new Date(L.time).toLocaleDateString('en-GB',{hour:'2-digit',minute:'2-digit',second:'2-digit'})} - {L.log}</span>
                  })
                }
              </div>
          </div>
        </section>
      </div>
    );
  }
}

export default Game;
