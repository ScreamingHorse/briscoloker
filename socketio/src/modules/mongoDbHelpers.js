const debug = require('debug')('briscoloker:mongoHelpers');
const { MongoClient } = require('mongodb');
const ObjectId = require('mongodb').ObjectID;

class BriscolokerMongo {
  constructor(connectionString) {
    this.connectionString = connectionString;
  }

  connect() {
    return new Promise((resolve) => {
      if (!this.connection) {
        MongoClient.connect(this.connectionString, { useNewUrlParser: true },
          (err, client) => {
            if (err) {
              console.error(err);
              return false;
            }
            this.connection = client.db('briscoloker');
            debug('Mongo already');
            resolve(this.connection);
          });
      } else {
        debug('Mongo already');
        resolve(this.connection);
      }
    });
  }

  getStuffFromMongo(collection, filter, sorted, limit) {
    return new Promise(async (resolve, reject) => {
      const connection = await this.connect();
      connection.collection(collection)
        .find(filter)
        .sort(sorted)
        .limit(limit)
        .toArray((err, results) => {
          if (err) {
            reject(err);
          } else {
            resolve(results);
          }
        });
    });
  }

  getLimitlessStuffFromMongo(collection, filter, sorted, options) {
    if (typeof options === 'undefined') {
      options = {};
    }
    return new Promise(async (resolve, reject) => {
      const connection = await this.connect();
      connection.collection(collection)
        .find(filter, options)
        .sort(sorted)
        .toArray((err, results) => {
          if (err) {
            reject(err);
          } else {
            resolve(results);
          }
        });
    });
  }

  updateOneByObjectId(collection, objectId, document) {
    return new Promise(async (resolve, reject) => {
      const connection = await this.connect();
      const updateInstructions = {
        $set: document,
      };
      debug('updateInstructions', updateInstructions);
      connection.collection(collection)
        .updateOne({ _id: objectId }, updateInstructions,
          (err) => {
            if (err) {
              reject(err);
            } else {
              resolve(true);
            }
          });
    });
  }

  insertOneThingInMongo(collection, document) {
    return new Promise(async (resolve, reject) => {
      const connection = await this.connect();
      connection.collection(collection)
        .insertOne(document,
          (err, result) => {
            if (err) {
              reject(err);
            } else {
              resolve(result.ops[0]._id);
            }
          });
    });
  }

  deleteOneByObjectId(collection, objectId) {
    return new Promise(async (resolve, reject) => {
      const connection = await this.connect();
      connection.collection(collection)
        .deleteOne({ _id: ObjectId(objectId) },
          (err) => {
            if (err) {
              reject(err);
            } else {
              resolve(true);
            }
          });
    });
  }

  deleteManyThingsBySearchObject(collection, searchObject) {
    return new Promise(async (resolve, reject) => {
      const connection = await this.connect();
      connection.collection(collection)
        .deleteMany(searchObject,
          (err) => {
            if (err) {
              reject(err);
            } else {
              resolve(true);
            }
          });
    });
  }
}

module.exports = connectionString => new BriscolokerMongo(connectionString);
