"use strict";

/** Routes for results. */

const express = require("express");
const jsonschema = require("jsonschema");

const router = express.Router();
const { BadRequestError } = require("../expressError");

const Comment = require("../models/comment");
const commentNewSchema = require("../schemas/commentNew.json");
const commentSearchSchema = require("../schemas/commentSearch.json");
const commentUpdateSchema = require("../schemas/commentUpdate.json");


/** POST / { data }  => { comment }
 *
 * data must include { resultId, userId, content }
 * 
 * comment is { id, resultId, userId, content, createDate }
 **/
 router.post("/", async function (req, res, next) {
  try {    
    const validator = jsonschema.validate(req.body, commentNewSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }

    const comment = await Comment.create(req.body);
    return res.status(201).json({ comment });
  } catch (err) {
    return next(err);
  }
});



/** GET / => { comments: [ { comment1, comment2, ... } ] }
 * Returns a list of comments
 * 
 * Search filters:
 * - resultId
 * - userId
 * - content
 * 
 * comment is { id, resultId, userId, content, createDate, modifyDate }
 **/
 router.get("/", async function (req, res, next) {
  try {  
    const query = req.query;
    if (query.resultId !== undefined) query.resultId = +query.resultId;
    if (query.userId !== undefined) query.userId = +query.userId;

    const validator = jsonschema.validate(query, commentSearchSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }

    const comments = await Comment.findAll(query);

    return res.json({ comments });
  } catch (err) {
    return next(err);
  }
});


/** GET /[id] => { comment }
 * Returns comment data given comment id
 * 
 * comment is { id, resultId, userId, content, createDate, modifyDate }
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
 * Returns { id, resultId, userId, content, createDate, modifyDate }
 **/

 router.patch("/:id", async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, commentUpdateSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }

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


