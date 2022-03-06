"use strict";

/** Routes for workouts */

const express = require("express");

const jsonschema = require("jsonschema");
const router = express.Router();

const { BadRequestError } = require("../expressError");

const ApiCall = require("../models/apicall");

const apicallsSearchSchema = require("../schemas/apicallsSearch.json");


/** GET / => { workout }
 * Returns workout details from the SugarWod API
 * 
 * Optional search filter:
 * - publishdate 
 * If no publishdate is provided, the default response from the API is today's date
 * 
 * workout is { swId, name, description, category, scoreType, publishDate }
 **/
 router.get("/", async function (req, res, next) {
  try { 
    const validator = jsonschema.validate(req.query, apicallsSearchSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }

    let {publishDate} = req.query;
    let data = await ApiCall.getWorkouts(publishDate);

    return res.json({ data });
  } catch (err) {
    return next(err);
  }
});


module.exports = router;

