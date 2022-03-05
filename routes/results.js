"use strict";

/** Routes for results. */

const express = require("express");
const jsonschema = require("jsonschema");

const router = express.Router();

const { BadRequestError } = require("../expressError");

const Result = require("../models/result");
const resultNewSchema = require("../schemas/resultNew.json");
const resultUpdateSchema = require("../schemas/resultUpdate.json");

/** POST / { data }  => { result }
 *
 * data must include { userId, familyId, workoutId }
 * data may include { score, notes }
 * 
 * result is { id, userId, familyId, workoutId, score, notes, createDate, completeDate }
 **/
 router.post("/", async function (req, res, next) {
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
 * 
 * result is { id, userId, familyId, workoutId, score, notes, createDate, modifyDate, completeDate }
 **/
 router.get("/", async function (req, res, next) {
  try {  
    const results = await Result.findAll(req.query);

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
 *   { score, notes, date, completeDate }
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


