const debug = require("debug")('briscoloker:briscolokerHelpers:playACard');
const mongoDbHelpers = require('../mongoDbHelpers');
const ObjectId = require("mongodb").ObjectID;
const getMyGameBro = require('./getMyGameBro');

module.exports = async (token, mongoClient, card) => {
  const suitMap = [
    'Bats',
    'Cups',
    'Coins',
    'Swords',
  ];
  const cardNameMap = [
    'Ace',
    '2',
    'Three',
    '4',
    '5',
    '6',
    '7',
    'Jack',
    'Knight',
    'King',
  ]
  //get the game
  debug("token",token);
  debug("card", card);
  let game = await getMyGameBro(token, mongoClient);
  let hero = game.players.filter(P => {
    return P.id === token
  })[0];
  let villan = game.players.filter(P => {
    return P.id !== token
  })[0];
  let currentHand = game.currentHand;

  //1. get the card that I want to play
  let cardToPlay = hero.hand.filter(C => C.value === card.value && C.suit === card.suit)[0];
  hero.hand.splice(hero.hand.findIndex(C => C.value === card.value && C.suit === card.suit),1);
  if (currentHand.isFolded) {
    game.discardedCards.push(cardToPlay);
    let isTrump = (cardToPlay.suit === game.trumpCard.suit);
    game.logs.push({
      time : new Date().getTime(),
      log : `${hero.name} discarded a card`,
    });
  } else {
    hero.currentHand.playedCard = cardToPlay;
    let isTrump = (cardToPlay.suit === game.trumpCard.suit);
    game.logs.push({
      time : new Date().getTime(),
      log : `${hero.name} played ${cardNameMap[cardToPlay.value-1]} of ${(isTrump) ? 'Trump' : suitMap[cardToPlay.suit]}`,
    });  
  }

  //2. switch the initiative
  hero.initiative = false;
  villan.initiative = true;

  //3 save the state of the game into mongo
  const gamesCollection = mongoClient.collection('games');
  await mongoDbHelpers.updateOneByObjectId(gamesCollection,ObjectId(game._id),game);

  //4 return game
  return game;
};