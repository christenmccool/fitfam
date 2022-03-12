"use strict";

/** Routes for results. */

const express = require("express");
const jsonschema = require("jsonschema");

const router = express.Router();

const { ensureLoggedIn } = require("../middleware/auth");
const { BadRequestError, ForbiddenError } = require("../expressError");

const Result = require("../models/result");
const resultNewSchema = require("../schemas/resultNew.json");
const resultSearchSchema = require("../schemas/resultSearch.json");
const resultUpdateSchema = require("../schemas/resultUpdate.json");

/** POST / { data }  => { result }
 *
 * data must include { userId, postId }
 * data may include { score, notes }
 * 
 * result is { id, userId, postId, score, notes, createDate, completeDate, userFirst, userLast }
 **/
 router.post("/", ensureLoggedIn, async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, resultNewSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }

    //user may only post for themselves
    const {userId} = req.body;
    if (!res.locals.user.isAdmin && !(res.locals.user.userId === userId)) {
      throw new ForbiddenError(`Only admin or a user themselves can add a user's result`);
    }

    const result = await Result.create(req.body);
    return res.status(201).json({ result });
  } catch (err) {
    return next(err);
  }
});


/** GET / => { results: [ { result1, result2, ... } ] }
 * Returns a list of results
 * 
 * Search filters:
 * - postId
 * - userId
 * - notes
 * 
 * result is { id, userId, postId, score, notes, completeDate, userFirst, userLast }
 **/
 router.get("/", ensureLoggedIn, async function (req, res, next) {
  try {  
    const query = req.query;
    if (query.userId !== undefined) query.userId = +query.userId;
    if (query.postId !== undefined) query.postId = +query.postId;
    if (query.score !== undefined) query.score = +query.score;

    const validator = jsonschema.validate(query, resultSearchSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }

    const results = await Result.findAll(query);

    return res.json({ results });
  } catch (err) {
    return next(err);
  }
});


/** GET /[id] => { result }
 * Returns workout result data given result id
 * 
 * result is { id, userId, postId, score, notes, createDate, modifyDate, completeDate, userFirst, userLast }
 **/
 router.get("/:id", ensureLoggedIn, async function (req, res, next) {
  try {  
    const {id} = req.params;
    
    const result = await Result.find(id);

    return res.json({ result });
  } catch (err) {
    return next(err);
  }
});


/** PATCH /[id] { data } => { result }
 *
 * Data may include:
 *   { score, notes, completeDate }
 *
 * result is { id, userId, postId, score, notes, createDate, modifyDate, completeDate, userFirst, userLast }
 **/

 router.patch("/:id", ensureLoggedIn, async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, resultUpdateSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }

    const {id} = req.params;
    let result = await Result.find(id);

    result = await result.update(req.body);

    return res.json({ result });
  } catch (err) {
    return next(err);
  }
});


/** DELETE /[id]  =>  { deleted: id }
 **/
 router.delete("/:id", ensureLoggedIn, async function (req, res, next) {
  try {
    const {id} = req.params;
    let result = await Result.find(id);

    await result.remove();
    return res.json({ deleted: id });
  } catch (err) {
    return next(err);
  }
});


module.exports = router;


