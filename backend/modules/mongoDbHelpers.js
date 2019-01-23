const getStuffFromMongo = (collection,filter,sorted,limit) => {
  return new Promise ((resolve, reject) => {
    collection
      .find(filter)
      .sort(sorted)
      .limit(limit)
      .toArray((err, results) => {
        if (err) {
          reject(err);
        } else {
          resolve(results);
        }
      })
  })
}

const insertOneThingInMongo = (collection, document) => {
  return new Promise ((resolve, reject) => {
    collection.insertOne(document, (err,result) => {
        if (err) {
          reject(err);
        } else {
          resolve(true);
        }
      })
  })
}

const deleteOneByObjectId = (collection, objectId) => {
  return new Promise((resolve, reject) => {
    openRoomsCollection.deleteOne({_id:objectId},(err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(true);
        }
      }
    );
  });
}

module.exports = {
  getStuffFromMongo,
  insertOneThingInMongo,
  deleteOneByObjectId,
}
