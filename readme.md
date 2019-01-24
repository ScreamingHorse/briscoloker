**FrontEnd:**

  - React application
    [https://github.com/facebook/create-react-app]([https://github.com/facebook/create-react-app])
    
    Networking is done using:
    - Axios for API
    - Socket.io client for the websocket

**Backend:**

- Socket.io [https://socket.io/](https://socket.io/) on top of Express [https://expressjs.com/](https://expressjs.com/)

**Databases:**

  - Mongo DB [https://www.mongodb.com/](https://www.mongodb.com/)
  - Redis [https://redis.io/](https://redis.io/)
  (Docker for development)

**Prereq:**

- nodeJs [https://nodejs.org/en/](https://nodejs.org/en/)
- nodemon [https://nodemon.io/](https://nodemon.io/) `npm install -g nodemon`
- docker [https://www.docker.com/](https://www.docker.com/)

**How to start the applciations**

1) Start MongoDB Server and the Redis server using the docker-compose file

   `docker-compose up -d`
   
2) Start the web socket / API server inside the backend folder

	`npm start`

By default it creates the server on port 3001 

3) Start the frontend server in the frontend folder

	`npm start`

By default it runs on port 3000   

**Rules of the game:**

2 player game:
  Deck: 40 cards deck

  -> At the each player receive 3 cards
  -> At the start of the game the top card of the pile is turned over. That card is called "Briscola".
    The suit of the briscola is a trump.

  Round
  1. Player one makes a bet.
  2. The second player can:
    Call the bet: in this case:
      a. Player one plays
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
