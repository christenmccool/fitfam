"use strict";

/** Routes for results. */

const express = require("express");

const router = express.Router();
const { BadRequestError } = require("../expressError");

const Comment = require("../models/comment");


/** POST / { data }  => { comment }
 *
 * data must include { resultId, username, content }
 * 
 * comment is { id, resultId, username, content, date }
 **/
 router.post("/", async function (req, res, next) {
  try {    
    const comment = await Comment.create(req.body);
    return res.status(201).json({ comment });
  } catch (err) {
    return next(err);
  }
});


/** GET / => { comments: [ { comment1, comment2, ... } ] }
 * Returns a list of results
 * 
 * comment is { id, resultId, username, content, date }
 **/
 router.get("/", async function (req, res, next) {
  try {  
    const comments = await Comment.findAll();

    return res.json({ comments });
  } catch (err) {
    return next(err);
  }
});


/** GET /[id] => { comment }
 * Returns comment data given comment id
 * 
 * comment is { id, resultId, username, content, date }
 **/
 router.get("/:id", async function (req, res, next) {
  try {  
    const {id} = req.params;
    
    const comment = await Comment.find(id);

    return res.json({ comment });
  } catch (err) {
    return next(err);
  }
});


/** PATCH /[id] { data } => { comment }
 *
 * Data must include:
 *   { content }
 *
 * Returns { id, resultId, username, content, date }
 **/

 router.patch("/:id", async function (req, res, next) {
  try {
    const {id} = req.params;
    let comment = await Comment.find(id);

    comment = await comment.update(req.body);

    return res.json({ comment });
  } catch (err) {
    return next(err);
  }
});


/** DELETE /[id]  =>  { deleted: id }
 **/
 router.delete("/:id", async function (req, res, next) {
  try {
    const {id} = req.params;
    let comment = await Comment.find(id);

    await comment.remove();
    return res.json({ deleted: id });
  } catch (err) {
    return next(err);
  }
});


module.exports = router;


