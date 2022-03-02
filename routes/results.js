"use strict";

/** Routes for results. */

const express = require("express");

const router = express.Router();
const { BadRequestError } = require("../expressError");

const Result = require("../models/result");


/** POST / { data }  => { result }
 *
 * data must include { username, familyId, workoutId }
 * data may include { score, notes }
 * 
 * result is { id, username, familyId, workoutId, score, notes, dateCompleted }
 **/
 router.post("/", async function (req, res, next) {
  try {
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
 * - username
 * - familyId
 * 
 * result is { id, username, familyId, workoutId, score, notes, dateCompleted }
 **/
 router.get("/", async function (req, res, next) {
  try {  
    const {workoutId, username, familyId} = req.query;

    const results = await Result.findAll(workoutId, username, familyId);

    return res.json({ results });
  } catch (err) {
    return next(err);
  }
});


/** GET /[id] => { result }
 * Returns workout result data given result id
 * 
 * result is { id, username, familyId, workoutId, score, notes, dateCompleted }
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
 *   { score, notes, date }
 *
 * Returns { id, username, familyId, workoutId, score, notes, dateCompleted }
 **/

 router.patch("/:id", async function (req, res, next) {
  try {
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


