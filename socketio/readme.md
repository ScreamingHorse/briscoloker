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

**How to start the application**

1) Start MongoDB Server and the Redis server using the docker-compose file

   `docker-compose up -d`
   
2) Start the web socket / API server inside the backend folder

	`npm start`

By default it creates the server on port 3001 

***The software is distributed under the GNU General Public License***
