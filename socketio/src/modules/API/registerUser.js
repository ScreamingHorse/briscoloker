const debug = require('debug')('briscoloker:registerUser');
const crypto = require('crypto');
const pbkdf2 = require('pbkdf2');

module.exports = (mongoClient, username, password, email) => {
  debug('Register user');
  return new Promise(async (resolve, reject) => {
    if (process.env.FEATURE_REGISTRATION === 'on') {
      try {
        // 1. username and password not null
        if (username === '' || password === '') {
          throw Error('Cmon, provide both username and password');
        }
        // 2. username not duplicate
        const userFromMongo = await mongoClient.getLimitlessStuffFromMongo('users', { username }, {});
        debug('userFromMongo', userFromMongo);
        if (userFromMongo.length > 0) {
          throw Error('Duplicates');
        }
        // 3. insert the new user and return the ObjectId
        const salt = crypto.randomBytes(256).toString('base64').slice(6, 18);
        const hashedPassword = pbkdf2.pbkdf2Sync(password, salt, 1500, 32, 'sha256').toString('base64');
        const userObject = {
          username,
          password: hashedPassword,
          salt,
          email,
          creationDate: new Date(),
          wins: 0,
          losses: 0,
          rating: 1500,
        };
        const userId = await mongoClient.insertOneThingInMongo('users', userObject);
        debug('userId', userId);
        resolve(userId);
      } catch (e) {
        console.error(e);
        reject(e);
      }
    } else {
      reject(Error('Not allowed'));
    }
  });
};
