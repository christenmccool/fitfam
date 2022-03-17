"use strict";

/** Routes for families. */

const express = require("express");

const jsonschema = require("jsonschema");
const router = express.Router();

const { ensureLoggedIn } = require("../middleware/auth");
const { BadRequestError, ForbiddenError } = require("../expressError");
const { verifyMembership } = require("../services/verifyMembership");

const Family = require("../models/family");
const familyNewSchema = require("../schemas/familyNew.json");
const familySearchSchema = require("../schemas/familySearch.json");
const familyUpdateSchema = require("../schemas/familyUpdate.json");


/** POST / { data }  => { family }
 *
 * data must include { familyName, joinCode }
 * data may include { imageUrl, bio }
 * 
 * family is { id, familyname, imageUrl, bio, createDate }
 **/
 router.post("/", ensureLoggedIn, async function (req, res, next) {
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
 * - joinCode
 * - bio (keyword match)
 * 
 * family is { id, familyName, joinCode, image_url, bio }
 **/
 router.get("/", ensureLoggedIn, async function (req, res, next) {
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


/** GET /[familyId] => { family }
 * Returns family data given family id
 * 
 * family is id, familyName, joinCode, imageUrl, bio, createDate, modifyDate, users }
 * 
 * users is [ user1, user2, ... } ]
 *    where user is { userId, firstName, lastName }
 **/
 router.get("/:familyId", ensureLoggedIn, async function (req, res, next) {
  try {  
    const {familyId} = req.params;

    const isMember = await verifyMembership(res.locals.user.userId, +familyId);
    if (!res.locals.user.isAdmin && !isMember) {
      throw new ForbiddenError(`Must be a member of family ${familyId} to access`);
    }

    const family = await Family.find(familyId);

    return res.json({ family });
  } catch (err) {
    return next(err);
  }
});


/** PATCH /[familyId] { data } => { family }
 *
 * Data can include:
 *   { familyName, imageUrl, bio }
 *
 * Returns { id, familyName, joinCode, imageUrl, bio, createDate, modifyDate }
 **/
 router.patch("/:familyId", ensureLoggedIn, async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, familyUpdateSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }

    const {familyId} = req.params;

    const isMember = await verifyMembership(res.locals.user.userId, +familyId);
    if (!res.locals.user.isAdmin && !isMember) {
      throw new ForbiddenError(`Must be a member of family ${familyId} to access`);
    }

    let family = await Family.find(familyId);

    family = await family.update(req.body);

    return res.json({ family });
  } catch (err) {
    return next(err);
  }
});


/** DELETE /[familyId]  =>  { deleted: id }
 **/
 router.delete("/:familyId", ensureLoggedIn, async function (req, res, next) {
  try {
    const {familyId} = req.params;

    const isMember = await verifyMembership(res.locals.user.userId, +familyId);
    if (!res.locals.user.isAdmin && !isMember) {
      throw new ForbiddenError(`Must be a member of family ${familyId} to access`);
    }

    let family = await Family.find(familyId);

    await family.remove();
    return res.json({ deleted: familyId });
  } catch (err) {
    return next(err);
  }
});


module.exports = router;

