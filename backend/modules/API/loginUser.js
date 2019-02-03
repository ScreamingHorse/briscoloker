const debug = require('debug')('briscoloker:registerUser');
const pbkdf2 = require('pbkdf2');

module.exports = (mongoClient, username, password) => {
  debug('Login user');
  return new Promise(async (resolve, reject) => {
    try {
      const userData = await mongoClient.getLimitlessStuffFromMongo('users', { username }, {});
      debug('userData', userData);
      if (userData.length !== 1) {
        throw Error('Invalid login');
      } else {
        // found 1 user, need to check the password
        const hashedPassword = pbkdf2.pbkdf2Sync(password, userData[0].salt, 1500, 32, 'sha256').toString('base64');
        if (hashedPassword === userData[0].password) {
          resolve(userData[0]._id);
        } else {
          throw Error('Invalid login');
        }
      }
    } catch (e) {
      reject(e);
    }
  });
};
