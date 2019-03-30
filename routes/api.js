/*
 *
 *
 *       Complete the API routing below
 *
 *
 */

// I can POST a thread to a specific message board by passing form data text and delete_password to
// /api/threads/{board}.(Recomend res.redirect to board page /b/{board}) Saved will be _id,
// text, created_on(date&time), bumped_on(date&time, starts same as created_on), reported(boolean), delete_password, & replies(array).

const { expect } = require("chai");
const { ObjectId } = require("mongodb");

module.exports = (app, db) => {
  app
    .route("/api/threads/:board")

    .get((req, res) => {
      const { board } = req.params;

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
    })

    .post((req, res) => {
      const { board, text, delete_password } = req.body;
      const thread = {
        text,
        created_on: new Date(),
        bumped_on: new Date(),
        reported: false,
        delete_password,
        replies: []
      };
      const collection = db.collection(board);

      collection
        .insertOne(thread)
        .then(() => res.redirect(`/b/${board}`))
        .catch(err => console.error(`Failed to insert item: ${err}`));
    })

    .delete((req, res) => {
      const { board } = req.params;

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

  app
    .route("/api/replies/:board")

    .get((req, res) => {
      const { board } = req.params;

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
          return res.send(items);
        })
        .catch(err => console.error(`Failed to find documents: ${err}`));
    })

    .post((req, res) => {
      const { board, text, delete_password, thread_id } = req.body;
      const reply = {
        _id: ObjectId(),
        text,
        created_on: new Date(),
        reported: false,
        delete_password
      };

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
    })
    .delete((req, res) => {
      const { board } = req.params;

      console.log(req.body);

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
};
