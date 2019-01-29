const debug = require("debug")('briscoloker:briscolokerHelpers:startTheGameWillYa');
const mongoDbHelpers = require('../mongoDbHelpers');
const ObjectId = require("mongodb").ObjectID;
const getMyGameByName = require('./getMyGameByName');

module.exports = async (roomName, mongoClient) => {
  try {
    let game = await getMyGameByName(roomName, mongoClient);
    debug("game object", game);
    //get the gaming round
    if (typeof game.round === 'undefined') game.round = 1;
    game.discardedCards = [];
    game.isTheGameFinished = false;
    game.isTheRoundFinished = false;
    game.winnerOfTheWholeThing = null;
    game.lastRoundWinner = '';
    //update the players
    game.players.forEach(playerObject => {
      playerObject.cardsCaptured = [];
      playerObject.hand = [];
      playerObject.roundLeader = false;
      playerObject.initiative = false;
      playerObject.currentHand = {
        bets : 0,
        playedCard : null,
      };
      playerObject.score = 0;
      //Reset the chips only if it is the first round
      if (game.round === 1) {
        playerObject.chips = 100;
      }
    });
    //deck
    game.deck = [];
    //Everything is reset
    //Step 1: Build the deck
    //cycling the suits (0->3)
    for (var s = 0; s < 4; s++) {
      //values (1 -> 10)
      for (var v = 1; v <= 10; v++) {
        game.deck.push({
          value: v,
          suit: s,
        });
      }
    };
    debug("deck",game.deck);
    //step 2: Shuffle the deck
    game.deck.sort(()=> Math.random()-0.5);
    //step 3 decide who is the first to play
    game.roundLeader = [0,1].sort(()=>Math.random()-0.5)[0];
    game.players[game.roundLeader].roundLeader = true;
    game.players[game.roundLeader].initiative = true;
    //step 4 pick the cards for the players
    //I am picking one each.
    for (var ii=0; ii<3; ii++) {
      game.players[0].hand.push(game.deck.pop());
      game.players[1].hand.push(game.deck.pop());
    }
    debug("deck",game.deck);
    //step 5 pick the Trump
    game.trumpCard = game.deck.pop();
    game.isStarted = true;
    //step 6 create the current hand object
    game.currentHand = {
        bettingRound: 0,
        isBettingPhase: true,
        isFolded: false,
        pot:0,
        winner : null,
    }
    //step 7 sideBet
    //sizing the sideBet
    game.sideBet = parseInt(10 * game.round);
    game.players.forEach(P => {
      if (P.chips <= game.sideBet) {
        game.sideBet = P.chips;
      }
    });
    game.players[0].chips -= game.sideBet;
    game.players[1].chips -= game.sideBet;

    const gamesCollection = mongoClient.collection('games');
    await mongoDbHelpers.updateOneByObjectId(gamesCollection,ObjectId(game._id),game);
    return true;
  } catch (e) {
    console.error("error creating the game", e);
    return false;
  }
}