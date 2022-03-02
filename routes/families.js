"use strict";

/** Routes for families. */

const express = require("express");

const router = express.Router();
const { BadRequestError } = require("../expressError");

const Family = require("../models/family");
const Result = require("../models/result");


/** POST / { data }  => { family }
 *
 * data must include { familyname }
 * data may include { imageUrl, bio }
 * 
 * family is { id, familyname, image_url, bio, creationDate }
 **/
 router.post("/", async function (req, res, next) {
  try {
    const family = await Family.create(req.body);
    return res.status(201).json({ family });
  } catch (err) {
    return next(err);
  }
});


/** GET / => { families: [ { family1, family2, ... } ] }
 * Returns a list of families
 * 
 * family is { id, familyname, image_url, bio, creationDate }
 **/
 router.get("/", async function (req, res, next) {
  try {  
    const families = await Family.findAll();

    return res.json({ families });
  } catch (err) {
    return next(err);
  }
});


/** GET /[id] => { family }
 * Returns family data given family id
 * 
 * family is { id, familyname, image_url, bio, creationDate, users }
 * 
 * users is [ username1, username2, ... } ]
 **/
 router.get("/:id", async function (req, res, next) {
  try {  
    const {id} = req.params;

    const family = await Family.find(id);

    return res.json({ family });
  } catch (err) {
    return next(err);
  }
});


/** PATCH /[id] { data } => { family }
 *
 * Data can include:
 *   { familyname, imageUrl, bio }
 *
 * Returns { id, familyname, image_url, bio, creationDate }
 **/
 router.patch("/:id", async function (req, res, next) {
  try {
    const {id} = req.params;
    let family = await Family.find(id);

    family = await family.update(req.body);

    return res.json({ family });
  } catch (err) {
    return next(err);
  }
});


/** DELETE /[id]  =>  { deleted: id }
 **/
 router.delete("/:id", async function (req, res, next) {
  try {
    const {id} = req.params;
    let family = await Family.find(id);

    await family.remove();
    return res.json({ deleted: id });
  } catch (err) {
    return next(err);
  }
});


/** GET /[id]/results => { results: [ { result1, result2, ... } ] }
 * Returns list of results given family id
 * 
 * result is { id, username, familyId, workoutId, score, notes, dateCompleted }
 **/
 router.get("/:id/results", async function (req, res, next) {
  try {  
    const {id} = req.params;

    const results = await Result.findAll(null, null, id);

    return res.json({ results });
  } catch (err) {
    return next(err);
  }
});


/** GET /[familyId]/workouts/[workoutId]/results => { results: [ { result1, result2, ... } ] }
 * Returns list of results given family id and workout id
 * 
 * result is { id, username, familyId, workoutId, score, notes, dateCompleted }
 **/
 router.get("/:familyId/workouts/:workoutId/results", async function (req, res, next) {
  try {  
    const {familyId, workoutId} = req.params;

    const results = await Result.findAll(workoutId, null, familyId);

    return res.json({ results });
  } catch (err) {
    return next(err);
  }
});


module.exports = router;

