const debug = require('debug')('briscoloker:betting');
const briscolokerHelpers = require('./briscolokerHelpers');

module.exports = async (io, mongoClient, token, card) => {
  try {
    //1 check if the token can bet
    let game = await briscolokerHelpers.getMyGameBro(token, mongoClient);
    //debug(game);
    const player = game.players.filter(P => {
      return P.id === token
    })[0];
    debug("card", card);
    //2 play a card
    //We need to check the initiative, and that the player has the card in his hand, and that we are not in the betting phase
    let cardInHand = player.hand.filter(C => {
      return C.suit === card.suit && C.value === card.value 
    })
    if (player.initiative && !game.currentHand.isBettingPhase && cardInHand.length === 1) {
      game = await briscolokerHelpers.playACard(token, mongoClient, card);
    }
    //3 send the specifc game state to each player
    await briscolokerHelpers.sendAllTheGameStates(io, game.name, mongoClient);
    
    //4 Check if the hand is ready to be solved (both player played a card)
    debug(game.players[0].playedCard,game.players[1].playedCard);
    if (game.players[0].playedCard !== null && game.players[1].playedCard !== null) {
      setTimeout(async()=>{
        //5 resolve the hand
        briscolokerHelpers.resolveHand(mongoClient);
        //6 notify the clients
        await briscolokerHelpers.sendAllTheGameStates(io, game.name, mongoClient);
      },150);
    }
  } catch (e) {
    console.error(e);
  }
}
