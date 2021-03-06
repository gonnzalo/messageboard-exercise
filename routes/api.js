/*
 *
 *
 *       Complete the API routing below
 *
 *
 */

const { ObjectId } = require("mongodb");
const { MongoClient } = require("mongodb");

const MONGODB_CONNECTION_STRING = process.env.DB;

module.exports = app => {
  app
    .route("/api/threads/:board")

    .get((req, res) => {
      const { board } = req.params;

      const client = new MongoClient(MONGODB_CONNECTION_STRING, {
        useNewUrlParser: true
      });
      client.connect(err => {
        const db = client.db("messageboard");
        // perform actions on the collection object
        const collection = db.collection(board);
        collection
          .find(
            {},
            {
              projection: {
                reported: 0,
                delete_password: 0,
                "replies.reported": 0,
                "replies.delete_password": 0,
                replies: { $slice: -3 }
              }
            }
          )
          .sort({ bumped_on: -1, "replies.created_on": 1 })
          .limit(10)
          .toArray()
          .then(items => {
            return res.send(items);
          })
          .catch(err => console.error(`Failed to find documents: ${err}`));
      });
    })

    .post((req, res) => {
      const { board } = req.params;
      const { text, delete_password } = req.body;
      const thread = {
        text,
        created_on: new Date(),
        bumped_on: new Date(),
        reported: false,
        delete_password,
        replies: []
      };

      const client = new MongoClient(MONGODB_CONNECTION_STRING, {
        useNewUrlParser: true
      });
      client.connect(err => {
        const db = client.db("messageboard");
        // perform actions on the collection object
        const collection = db.collection(board);

        collection
          .insertOne(thread)
          .then(() => res.redirect(`/b/${board}`))
          .catch(err => console.error(`Failed to insert item: ${err}`));
      });
    })

    .put((req, res) => {
      const { board } = req.params;

      const client = new MongoClient(MONGODB_CONNECTION_STRING, {
        useNewUrlParser: true
      });
      client.connect(err => {
        const db = client.db("messageboard");
        // perform actions on the collection object
        const collection = db.collection(board);

        collection
          .findOneAndUpdate(
            { _id: ObjectId(req.body.report_id) },
            { $set: { reported: true } }
          )
          .then(() => {
            res.send("reported");
          })
          .catch(err =>
            console.error(`Failed to find and update document: ${err}`)
          );
      });
    })

    .delete((req, res) => {
      const { board } = req.params;

      const client = new MongoClient(MONGODB_CONNECTION_STRING, {
        useNewUrlParser: true
      });
      client.connect(err => {
        const db = client.db("messageboard");
        // perform actions on the collection object
        const collection = db.collection(board);

        collection
          .findOneAndDelete({
            _id: ObjectId(req.body.thread_id),
            delete_password: req.body.delete_password
          })
          .then(response => {
            if (!response.value) return res.send("incorrect password");
            return res.send("success");
          })
          .catch(err => console.error(`Failed to deleted document: ${err}`));
      });
    });

  app
    .route("/api/replies/:board")

    .get((req, res) => {
      const { board } = req.params;

      const client = new MongoClient(MONGODB_CONNECTION_STRING, {
        useNewUrlParser: true
      });
      client.connect(err => {
        const db = client.db("messageboard");
        // perform actions on the collection object
        const collection = db.collection(board);

        collection
          .find(
            { _id: ObjectId(req.query.thread_id) },
            {
              projection: {
                reported: 0,
                delete_password: 0,
                "replies.reported": 0,
                "replies.delete_password": 0,
                replies: { $slice: [0, 3] }
              }
            }
          )
          .toArray()
          .then(items => {
            return res.send(items[0]);
          })
          .catch(err => console.error(`Failed to find documents: ${err}`));
      });
    })

    .post((req, res) => {
      const { board } = req.params;
      const { text, delete_password, thread_id } = req.body;
      const reply = {
        _id: ObjectId(),
        text,
        created_on: new Date(),
        reported: false,
        delete_password
      };

      const client = new MongoClient(MONGODB_CONNECTION_STRING, {
        useNewUrlParser: true
      });
      client.connect(err => {
        const db = client.db("messageboard");
        // perform actions on the collection object
        const collection = db.collection(board);

        collection
          .findOneAndUpdate(
            { _id: ObjectId(thread_id) },
            { $set: { bumped_on: new Date() }, $push: { replies: reply } }
          )
          .then(() => res.redirect(`/b/${board}/${thread_id})`))
          .catch(err =>
            console.error(`Failed to find and update document: ${err}`)
          );
      });
    })

    .put((req, res) => {
      const { board } = req.params;

      const client = new MongoClient(MONGODB_CONNECTION_STRING, {
        useNewUrlParser: true
      });
      client.connect(err => {
        const db = client.db("messageboard");
        // perform actions on the collection object
        const collection = db.collection(board);

        collection
          .findOneAndUpdate(
            {
              _id: ObjectId(req.body.thread_id),
              "replies._id": ObjectId(req.body.reply_id)
            },
            { $set: { "replies.$.reported": true } }
          )
          .then(() => {
            res.send("reported");
          })
          .catch(err =>
            console.error(`Failed to find and update document: ${err}`)
          );
      });
    })

    .delete((req, res) => {
      const { board } = req.params;

      const client = new MongoClient(MONGODB_CONNECTION_STRING, {
        useNewUrlParser: true
      });
      client.connect(err => {
        const db = client.db("messageboard");
        // perform actions on the collection object
        const collection = db.collection(board);

        collection
          .findOneAndUpdate(
            {
              _id: ObjectId(req.body.thread_id),
              replies: {
                $elemMatch: {
                  _id: new ObjectId(req.body.reply_id),
                  delete_password: req.body.delete_password
                }
              }
            },
            { $set: { "replies.$.text": "[deleted]" } }
          )
          .then(response => {
            if (!response.value) return res.send("incorrect password");
            return res.send("success");
          })
          .catch(err => console.error(`Failed to deleted document: ${err}`));
      });
    });
};
