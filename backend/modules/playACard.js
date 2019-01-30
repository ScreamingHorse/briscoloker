const debug = require('debug')('briscoloker:playACard');
const ObjectId = require('mongodb').ObjectID;
const briscolokerHelpers = require('./briscolokerHelpers');
const mongoDbHelpers = require('./mongoDbHelpers');

module.exports = async (io, mongoClient, token, card) => {
  try {
    // 1 check if the token can bet
    let game = await briscolokerHelpers.getMyGameBro(token, mongoClient);
    // debug(game);
    const player = game.players.filter(P => P.id === token)[0];
    debug('card', card);
    // 2 play a card
    // We need to check the initiative, and that the player has the card in his hand,
    // and that we are not in the betting phase
    const cardInHand = player.hand.filter(C => C.suit === card.suit && C.value === card.value);
    if (player.initiative && !game.currentHand.isBettingPhase && cardInHand.length === 1) {
      game = await briscolokerHelpers.playACard(token, mongoClient, card);
    }
    // 3 send the specifc game state to each player
    await briscolokerHelpers.sendAllTheGameStates(io, game.name, mongoClient);
    // 4 Check if the hand is ready to be solved
    // 4.1 : both player played a card and the hand is not folded
    const notFoldedHandDone = (
      !game.currentHand.isFolded
      && game.players[0].playedCard !== null
      && game.players[1].playedCard !== null
    );
    debug('4.1', game.currentHand.isFolded, game.players[0].playedCard, game.players[1].playedCard, notFoldedHandDone);
    // 4.2 : the hand is folded and both players have the same number of cards in the hand
    const foldedHandDone = (
      game.currentHand.isFolded
      && game.players[0].hand.length === game.players[1].hand.length
    );
    debug('4.2', game.currentHand.isFolded, game.players[0].hand.length, game.players[1].hand.length, foldedHandDone);
    if (notFoldedHandDone || foldedHandDone) {
      setTimeout(async () => {
        // 5 resolve the hand
        const [
          isTheRoundFinished,
          isTheGameFinished,
          theGame,
        ] = await briscolokerHelpers.resolveHand(game.name, mongoClient);
        debug('isTheRoundFinished', isTheRoundFinished);
        debug('isTheGameFinished', isTheGameFinished);
        // 6 notify the clients, the client display the message that a new round is starting
        await briscolokerHelpers.sendAllTheGameStates(io, game.name, mongoClient);
        // if the round is finished, wait few moments, then start the next round
        if (isTheRoundFinished && !isTheGameFinished) {
          setTimeout(async () => {
            debug('timer done!');
            // 7 create a new game
            await briscolokerHelpers.startTheGameWillYa(game.name, mongoClient);
            // 8 send the new state to the clients
            await briscolokerHelpers.sendAllTheGameStates(io, game.name, mongoClient);
          }, 1500);
        }
        // if the game is finishes I want to archive it
        // Archive means:
        // 1. remove from games
        // 2. adding it to gamesPlayed
        const gamesCollection = mongoClient.collection('games');
        const gamesPlayedCollection = mongoClient.collection('gamesPlayed');
        if (isTheGameFinished) {
          // 1. Remove the game from games
          await mongoDbHelpers.deleteOneByObjectId(gamesCollection, ObjectId(theGame._id));
          // 2. Add to archive
          await mongoDbHelpers.insertOneThingInMongo(gamesPlayedCollection, theGame);
        }
      }, 150);
    }
  } catch (e) {
    console.error(e);
  }
};
