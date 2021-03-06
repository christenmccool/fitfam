"use strict";

/** Routes for workouts */

const express = require("express");

const jsonschema = require("jsonschema");
const router = express.Router();

const { ensureLoggedIn } = require("../middleware/auth");
const { BadRequestError } = require("../expressError");

const Workout = require("../models/workout");

const workoutNewSchema = require("../schemas/workoutNew.json");
const workoutSearchSchema = require("../schemas/workoutSearch.json");
const workoutUpdateSchema = require("../schemas/workoutUpdate.json");


/** POST / { data }  => { workout }
 *
 * data may include { swId, name, description, category, scoreType, featuredDate, createBy }
 * data must include at least one property
 *  
 * workout is { id, swId, name, description, category, scoreType, createDate, featuredDate, createBy }
 **/
 router.post("/", ensureLoggedIn, async function (req, res, next) {
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
 * - swId (API id)
 * - name
 * - description 
 * - category ("girls", "heroes", "games", "featured", "custom")
 * - scoreType
 * - featuredDate
 * - createBy
 * - movementId
 * 
 * - keyword (name or description)
 * 
 * workout is { id, swId, name, description }
 **/

router.get("/", async function (req, res, next) {
  try {  
    const query = req.query;
    if (query.movementId && !Array.isArray(query.movementId)) {
      query.movementId = [query.movementId];
    }

    const validator = jsonschema.validate(query, workoutSearchSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }

    const workouts = await Workout.findAll(query);

    return res.json({ workouts });
  } catch (err) {
    return next(err);
  }
});


/** GET /[id] => { workout }
 * Returns workout details given workout id
 * 
 * workout is { id, swId, name, description, category, scoreType, createDate, modifyDate, featuredDate, createBy, movements }
 *    where movements is {movementId, movementName, youtubeId}
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
 *   { swId, name, description, category, scoreType }
 *
 * Returns { id, swId, name, description, category, scoreType, createDate, modifyDate, featuredDate, createBy }
 **/

 router.patch("/:id", ensureLoggedIn, async function (req, res, next) {
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
 router.delete("/:id", ensureLoggedIn, async function (req, res, next) {
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


