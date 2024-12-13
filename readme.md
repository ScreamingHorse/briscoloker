***REPO MOVED TO CODEBERG***
[https://codeberg.org/ScreamingHorseStudio/briscoloker](https://codeberg.org/ScreamingHorseStudio/briscoloker)




**Briscoloker**

Briscoloker is a card game, the project is split in several repositories.

**FrontEnd:**
The is a web client create with react app: [https://codeberg.org/ScreamingHorseStudio/briscoloker/src/branch/master/webclient](https://codeberg.org/ScreamingHorseStudio/briscoloker/src/branch/master/webclient)

**Backend:**

The server at the moment is a Socket.io: [https://codeberg.org/ScreamingHorseStudio/briscoloker/src/branch/master/socketio](https://codeberg.org/ScreamingHorseStudio/briscoloker/src/branch/master/socketio)


**Rules of the game:**

2 player game:O
  Deck: 40 cards deck

  -> At the each player receive 3 cards
  -> At the start of the game the top card of the pile is turned over. That card is called "Briscola".
    The suit of the briscola is a trump.

  Round
  1. Player one makes a bet.
  2. The second player can:
    Call the bet: in this case:
      a. Player one playsO
      b. Player two plays
      c. Highest card wins the round, the winner takes the cards and the bets.
    Fold: 
      a. Player one wins the money on the table
      b. Both of the player discard a card. This card is not going in any pot.
    Raise: Another round of betting opposite side.
  3. When the bets are settled the highest card wins the round and both card are moved to the winner's pot.
  
  If a player has not chips left there are no betting rounds.

  Card Values:
   ACE : 11 points
   3 : 10 points
   KING : 4 points
   HORSE: 3 points
   JACK : 2 points
   7, 6, 5, 4, 2 : 0 points
  If a card has the suit of the Trump Card, it will win gains any other suit.

  Examples:
    Trump: HEARTS
    Cards:
      Ks vs Jc -> Ks
      2s vs 6c -> 6c
      Aces vs 2h -> 2h

  4. The player who win the hand, pick the next card from the top of the pile
  5. The player who lost the prev hand pick a card
  6. The player who won the prev hand has the initiative. (Place the first bet)

  7. When all the cards are played the players count their cards and who got more points will win the game and take the side bet.

***The software is distributed under the GNU General Public License***
