"use strict";

/** Routes for families. */

const express = require("express");

const jsonschema = require("jsonschema");
const router = express.Router();

const { BadRequestError } = require("../expressError");

const Family = require("../models/family");
const familyNewSchema = require("../schemas/familyNew.json");
const familySearchSchema = require("../schemas/familySearch.json");
const familyUpdateSchema = require("../schemas/familyUpdate.json");


/** POST / { data }  => { family }
 *
 * data must include { familyName }
 * data may include { imageUrl, bio }
 * 
 * family is { id, familyname, imageUrl, bio, createDate, modifyDate }
 **/
 router.post("/", async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, familyNewSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }

    const family = await Family.create(req.body);
    return res.status(201).json({ family });
  } catch (err) {
    return next(err);
  }
});


/** GET / => { families: [ { family1, family2, ... } ] }
 * Returns a list of all families matching optional filtering criteria
 * 
 * Search filters:
 * - familyName
 * - bio (keyword match)
 * 
 * family is { id, familyName, image_url, bio, createDate, modifyDate }
 **/
 router.get("/", async function (req, res, next) {
  try {  
    const validator = jsonschema.validate(req.query, familySearchSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }

    const families = await Family.findAll(req.query);

    return res.json({ families });
  } catch (err) {
    return next(err);
  }
});


/** GET /[id] => { family }
 * Returns family data given family id
 * 
 * family is id, familyName, imageUrl, bio, createDate, modifyDate, users }
 * 
 * users is [ user1, user2, ... } ]
 *    where user is { userId, firstName, lastName }
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
 *   { familyName, imageUrl, bio }
 *
 * Returns { id, familyName, imageUrl, bio, createDate, modifyDate }
 **/
 router.patch("/:id", async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, familyUpdateSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }

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


module.exports = router;

