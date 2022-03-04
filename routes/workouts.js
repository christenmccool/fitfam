"use strict";

/** Routes for workouts. */

const express = require("express");
const moment = require("moment");

const jsonschema = require("jsonschema");
const router = express.Router();

const { BadRequestError } = require("../expressError");

const Workout = require("../models/workout");
const workoutNewSchema = require("../schemas/workoutNew.json");
const workoutUpdateSchema = require("../schemas/workoutUpdate.json");


/** POST / { data }  => { workout }
 *
 * data may include { swId, name, description, category, scoreType, publishDate }
 * data must include at least one property
 *  
 * workout is { id, swId, name, description, category, scoreType, createDate, publishDate }
 **/
 router.post("/", async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, workoutNewSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }

    const workout = await Workout.create(req.body);
    return res.status(201).json({ workout });
  } catch (err) {
    return next(err);
  }
});


/** GET /  =>
 *   { workouts: [ { id1, name1 }, { id2, name2 }, ...] }
 * 
 * Returns a list of workouts 
 * 
 * Search filters:
 * - date (format 'YYYYMMDD')
 * - category ("girls", "heroes", "games")
 * - movementIds
 * 
 * Default with no filter is today's date
 **/
router.get("/", async function (req, res, next) {
  try {  
    let {date, category} = req.query;
    const movementIds = req.query.movementIds ? [].concat(req.query.movementIds) : [];

    if (!date && !category && !movementIds.length) {
      date = moment().format("YYYYMMDD");
    }

    const workouts = await Workout.findAll(date, category, movementIds);

    return res.json({ workouts });
  } catch (err) {
    return next(err);
  }
});


/** GET /[id] => { workout }
 * Returns workout details given workout id
 * 
 * workout is { id, swId, name, description, category, scoreType, createDate, modifyDate, publishDate }
 **/
 router.get("/:id", async function (req, res, next) {
  try {  
    const {id} = req.params;

    const workout = await Workout.find(id);

    return res.json({ workout });
  } catch (err) {
    return next(err);
  }
});


/** PATCH /[id] { data } => { workout }
 *
 * Data can include:
 *   { swId, name, description, category, scoreType, publishDate }
 *
 * Returns { id, swId, name, description, category, scoreType, createDate, modifyDate, publishDate }
 **/

 router.patch("/:id", async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, workoutUpdateSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }

    const {id} = req.params;
    let workout = await Workout.find(id);

    workout = await workout.update(req.body);

    return res.json({ workout });
  } catch (err) {
    return next(err);
  }
});



/** DELETE /[id]  =>  { deleted: id }
 **/
 router.delete("/:id", async function (req, res, next) {
  try {
    const {id} = req.params;
    let workout = await Workout.find(id);

    await workout.remove();
    return res.json({ deleted: id });
  } catch (err) {
    return next(err);
  }
});



module.exports = router;


