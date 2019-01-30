const debug = require('debug')('briscoloker:briscolokerHelpers:resolveHand');
const ObjectId = require('mongodb').ObjectID;
const mongoDbHelpers = require('../mongoDbHelpers');
const getMyGameByName = require('./getMyGameByName');

/**
 * array that contains the actual value of the cards
 * Map value:
 * Ace -> INDEX 0 -> VALUE 12
 * 2 -> 1 -> VALUE 2
 * 3 -> 2 -> 11
 * 4 to 10 are mapped as they are
 */
const valueMapper = [12, 2, 11, 4, 5, 6, 7, 8, 9, 10];
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
const scoreMapper = [11, 0, 10, 0, 0, 0, 0, 2, 3, 4];

module.exports = async (gameName, mongoClient) => {
  let game = await getMyGameByName(gameName, mongoClient);

  let player1 = game.players[0];
  let player2 = game.players[1];
  let trumpCard = game.trumpCard;
  let currentHand = game.currentHand;
  let deck = game.deck;
  let isTheRoundFinished = false;
  let isTheGameFinished =false;
  let roundWinner = '';
  let winner = '';
  debug('player1', player1);
  debug('player2', player2);
  debug('trumpCard', trumpCard);
  debug('currentHand', currentHand);
  // get the 2 hands
  // the hand is not folded
  if (!currentHand.isFolded) {
    const heroCard = player1.currentHand.playedCard;
    const villanCard = player2.currentHand.playedCard;
    debug('heroCard', heroCard);
    debug('villanCard', villanCard);
    // check if any of the card is a Trump
    heroCard.isTrump = (heroCard.suit === trumpCard.suit);
    villanCard.isTrump = (villanCard.suit === trumpCard.suit);
    // check if no trump
    if (!heroCard.isTrump && !villanCard.isTrump) {
      //no one played a Trump card
      //check if the 2 cards have the same suit
      if (heroCard.suit === villanCard.suit) {
        //the cards are from the same suit
        //the higest wins
        if (valueMapper[heroCard.value-1] > valueMapper[villanCard.value-1]) {
          roundWinner = 'hero';
        } else {
          roundWinner = 'villan';
        }
      } else {
        //the cards are not from the same suit
        //the leader wins
        if (player1.roundLeader) {
          roundWinner = 'hero';
        } else {
          roundWinner = 'villan';
        }
      }
    } else if ((heroCard.isTrump && villanCard.isTrump)) {
      //2 trumps 
      //check the card with higher face value
      if (valueMapper[heroCard.value-1] > valueMapper[villanCard.value-1]) {
        roundWinner = 'hero';
      } else {
        roundWinner = 'villan';
      }
    } else {
      // 1 trumps
      if (heroCard.isTrump) {
        roundWinner = 'hero';
      } else {
        roundWinner = 'villan';
      }
    }
    let roundWinnerName = '';
    // add the card to the captured card
    if (roundWinner === 'hero') {// player_1 index 0
      player1.cardsCaptured.push(heroCard);
      player1.cardsCaptured.push(villanCard);
      // adding the pot to the hero bank
      player1.chips += currentHand.pot;
      player1.roundLeader = true;
      player1.initiative = true;
      player2.roundLeader = false;
      player2.initiative = false;
      roundWinnerName = player1.name;
    } else { // player_2 index 1
      player2.cardsCaptured.push(heroCard);
      player2.cardsCaptured.push(villanCard);
      // adding the pot to the villan account
      player2.chips += currentHand.pot;
      player2.roundLeader = true;
      player2.initiative = true;
      player1.roundLeader = false;
      player1.initiative = false;
      roundWinnerName = player2.name;
    }
    let handScore = scoreMapper[heroCard.value - 1] + scoreMapper[villanCard.value - 1];
    //calculating the current score for the players
    game.players.forEach(P => {
      let score = 0;
      P.cardsCaptured.forEach(C => {
        score += scoreMapper[C.value -1];
      });
      P.score = score;
    });
    
    game.logs.push({
      time: new Date().getTime(),
      log: `${roundWinnerName} won the hand for ${currentHand.pot} and ${handScore} points`,
    });
  } else {
    // the hand is folded
    let roundWinnerName = '';
    if (player1.id === currentHand.winner) {
      winner = 'hero';
      player1.chips += currentHand.pot;
      roundWinnerName = player1.name;
    } else {
      winner = 'villan';
      player2.chips += currentHand.pot;
      roundWinnerName = player2.name;
    }
    game.logs.push({
      time: new Date().getTime(),
      log: `${roundWinnerName} won the hand for ${currentHand.pot}`,
    });
  }
  // Log the hand
  // picking the new card
  if (roundWinner === 'hero') { // player_1
    // Pick a new card for each one Hero goes first);
    // Pick the cards only if there are cards!!
    if (deck.length > 0) {
      player1.hand.push(deck.pop());
      if (deck.length === 0) {
        // debugger;
        // no card left use trump
        player2.hand.push({ value: trumpCard.value, suit: trumpCard.suit });
        // trumpCard = {};
      } else {
        player2.hand.push(deck.pop());
      }
    }
  } else {
    //Pick a new card for each one Villan goes first);
    //only if the deck is not empty, broooo!
    if (deck.length > 0) {
      player2.hand.push(deck.pop());
      if (deck.length === 0) {
        //no card left use trump
        player1.hand.push({value: trumpCard.value, suit: trumpCard.suit});
        //trumpCard = {};
      } else {
        player1.hand.push(deck.pop());
      }
    }
  }
  //check if both of the player have money, if not the betting phase is skipped
  currentHand.isBettingPhase = true;
  debug('currentHand.isBettingPhase',currentHand.isBettingPhase);
  if (player1.chips === 0 || player2.chips === 0) {
    currentHand.isBettingPhase = false;
  }
  currentHand.bettingRound = 0;
  currentHand.pot = 0;
  currentHand.winner = null;
  currentHand.isFolded = false;

  //check if the game is still on
  let cardsPlayed = player1.cardsCaptured.length + player2.cardsCaptured.length + game.discardedCards.length;
  debug('cardsPlayed', cardsPlayed);
  if (cardsPlayed === 10) {
    debug("Game finished",player1.score, player2.score);
    game.isTheRoundFinished = true;
    //assign the sideBet
    if (player1.score === player2.score) {
      debug('it\'s a tie!!!!');
      player1.chips += game.sideBet;
      player2.chips += game.sideBet;
      game.lastRoundWinner = 'This round was a tie!';
      game.logs.push({
        time : new Date().getTime(),
        log : `Last round was a tie, each player recived ${game.sideBet}`,
      });
    } else if (player1.score > player2.score) {
      debug('player_1 won');
      player1.chips += game.sideBet * 2;
      if (player2.chips === 0) {
        game.gameWinner = player1;
      }
      game.lastRoundWinner = `The winner is ${player1.name}!`;
      game.logs.push({
        time : new Date().getTime(),
        log : `${player1.name} won for ${game.sideBet * 2}`,
      });
    } else {
      debug('player_2 won');
      player2.chips += game.sideBet * 2;
      if (player1.chips === 0) {
        game.gameWinner = player2;
      }
      game.lastRoundWinner = `The winner is ${player2.name}!`;
      game.logs.push({
        time : new Date().getTime(),
        log : `${player2.name} won for ${game.sideBet * 2}`,
      });
    }
  }
  debug('currentHand',currentHand);
  game.players.forEach(P => {
    //reset the bets
    P.currentHand.bets = 0;
    //reset the played cards
    P.currentHand.playedCard = null;
  });

  //if the round is finished I need to check if both of the players still have some chips
  if (game.isTheRoundFinished) {
    game.round ++;
    //playe 1 is without chips => player 2 won
    if (player1.chips === 0) {
      game.isTheGameFinished = true;
      game.winnerOfTheWholeThing = player2.name;
    } else if (player2.chips === 0) {
      //playe 2 is without chips => player 1 won
      game.isTheGameFinished = true;
      game.winnerOfTheWholeThing = player1.name;
    }
  }
  debug("game.isTheRoundFinished", game.isTheRoundFinished);
  debug("game.isTheGameFinished", game.isTheGameFinished);
  debug("game.lastRoundWinner", game.lastRoundWinner);
  debug("game.winnerOfTheWholeThing", game.winnerOfTheWholeThing);

  //3 save the state of the game into mongo
  const gamesCollection = mongoClient.collection('games');
  await mongoDbHelpers.updateOneByObjectId(gamesCollection,ObjectId(game._id),game);
  
  return [game.isTheRoundFinished,game.isTheGameFinished, game];
}