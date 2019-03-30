/*
 *
 *
 *       Complete the API routing below
 *
 *
 */

"use strict";

let {expect} = require('chai');
const { ObjectID } = require("mongodb");

module.exports = (app, collection) => {
  app.route("/api/threads/:board");

  app.route("/api/replies/:board");
};
