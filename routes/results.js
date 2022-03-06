"use strict";

/** Routes for results. */

const express = require("express");
const jsonschema = require("jsonschema");

const router = express.Router();

const { ensureLoggedIn, ensureValidReqBody } = require("../middleware/auth");
const { BadRequestError } = require("../expressError");

const Result = require("../models/result");
const resultNewSchema = require("../schemas/resultNew.json");
const resultSearchSchema = require("../schemas/resultSearch.json");
const resultUpdateSchema = require("../schemas/resultUpdate.json");

/** POST / { data }  => { result }
 *
 * data must include { userId, familyId, workoutId }
 * data may include { score, notes }
 * 
 * result is { id, userId, familyId, workoutId, score, notes, createDate, completeDate }
 **/
 router.post("/", ensureLoggedIn, ensureValidReqBody, async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, resultNewSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
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
 * - workoutId
 * - userId
 * - familyId
 * - score
 * - notes
 * 
 * result is { id, userId, familyId, workoutId, score, notes, completeDate }
 **/
 router.get("/", ensureLoggedIn, ensureValidReqBody, async function (req, res, next) {
  try {  
    const query = req.query;
    if (query.userId !== undefined) query.userId = +query.userId;
    if (query.familyId !== undefined) query.familyId = +query.familyId;
    if (query.workoutId !== undefined) query.workoutId = +query.workoutId;
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
 * result is { id, userId, familyId, workoutId, score, notes, createDate, modifyDate, completeDate }
 **/
 router.get("/:id", async function (req, res, next) {
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
 * Returns { id, userId, familyId, workoutId, score, notes, createDate, modifyDate, completeDate }
 **/

 router.patch("/:id", async function (req, res, next) {
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
 router.delete("/:id", async function (req, res, next) {
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


