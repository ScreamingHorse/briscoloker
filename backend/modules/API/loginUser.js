const debug = require('debug')('briscoloker:registerUser');
const pbkdf2 = require("pbkdf2");

module.exports = (mongoClient, username, password) => {
  debug("Login user");
  return new Promise((resolve, reject)=> {
      try {
        const usersCollection = mongoClient.collection('users');
        usersCollection.find({
          username
        }).toArray((error, data) => {
          try {
            if (error) {
              throw error;
            }
            if (data.length !== 1) {
              throw 'Invalid login';
            } else {
              //found 1 user, need to check the password
              const hashedPassword = pbkdf2.pbkdf2Sync(password, data[0].salt, 1500, 32, 'sha256').toString('base64');
              if (hashedPassword === data[0].password) {
                resolve(data[0]._id);
              } else {
                throw 'Invalid login';
              }
            }
          } catch (e) {
            reject(e);
          }
        });
      } catch (e) {
        reject(e);
      }
  })
}