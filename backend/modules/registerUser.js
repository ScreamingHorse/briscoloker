const debug = require('debug')('briscoloker:registerUser');
const ObjectId = require("mongodb").ObjectID;
const crypto = require("crypto");
const pbkdf2 = require("pbkdf2");

module.exports = (mongoClient, username, password) => {
  debug("Register user");
  return new Promise((resolve, reject)=> {
      try {
        //1. username and password not null
        if (username === '' || password === '') {
          throw 'Cmon, provide both username and password';
        }
        //2. username not duplicate
        const usersCollection = mongoClient.collection('users');
        usersCollection.find({username:username}).toArray((error, data) => {
          try {
            if (error) {
              throw 'Error'
            } else if (data.length > 0) {
              throw 'Duplicate';
            }
            //3. insert the new user and return the ObjectId
            const salt = crypto.randomBytes(256).toString('base64').slice(6,18);
            const hashedPassword = pbkdf2.pbkdf2Sync(password, salt, 1500, 32, 'sha256').toString('base64');
            let userObject = {
              username,
              password : hashedPassword,
              salt
            }
            usersCollection.insertOne(userObject, (error, r)=>{
              try {
                if (error) {
                  throw error;
                };
                resolve(r.ops[0]._id);
              } catch (e) {
                reject(e);
              }
            });
          } catch (e) {
            reject(e);
          }
        });
      } catch (e) {
        reject(e);
      }
  })
}