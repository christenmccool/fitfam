"use strict";

/** Routes for membership relationships between users and families */

const express = require("express");

const jsonschema = require("jsonschema");
const router = express.Router();

const { BadRequestError } = require("../expressError");
const Membership = require("../models/membership");
const membershipNewSchema = require("../schemas/membershipNew.json");
const membershipSearchSchema = require("../schemas/membershipSearch.json");
const membershipUpdateSchema = require("../schemas/membershipUpdate.json");


/** POST / { data }  => { membership }
* Create new membership relationship between a user and a family
*
* data must include { userId, familyId }
* data may include { memStatus, isAdmin, primaryFamily }
* 
* membership is { userId, familyId, memStatus, isAdmin, primaryFamily, createDate, modifyDate }
**/

router.post("/", async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, membershipNewSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }

    const membership = await Membership.create(req.body);

    return res.status(201).json({ membership });
  } catch (err) {
    return next(err);
  }
});


/** GET / => { memberships: [ membership1, membership2, ...] }
 * Returns a list of all memberships matching optional filtering criteria
 * 
 * Search filters:
 * - userId
 * - familyId
 * - memStatus
 * - isAdmin
 * - primaryFamily
 * 
 * membership is { userId, familyId, memStatus, isAdmin, primaryFamily, createDate, modifyDate }
 **/

 router.get("/", async function (req, res, next) {
  const query = req.query;
  if (query.userId !== undefined) query.userId = +query.userId;
  if (query.familyId !== undefined) query.familyId = +query.familyId;
  query.isAdmin = query.isAdmin === "true" || query.isAdmin === "";
  query.primaryFamily = query.primaryFamily === "true" || query.primaryFamily === "";

  try {  
    const validator = jsonschema.validate(query, membershipSearchSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }

    const memberships = await Membership.findAll(query);

    return res.json({ memberships });
  } catch (err) {
    return next(err);
  }
});


/** GET /[userId]-[familyId] => { membership }
 * Returns membership data given user id and family id
 * 
 * membership is { userId, familyId, memStatus, isAdmin, primaryFamily, createDate, modifyDate }
 * 
 **/
 router.get("/:userId-:familyId", async function (req, res, next) {
  try {  
    const {userId, familyId} = req.params;
    const membership = await Membership.find(userId, familyId);

    return res.json({ membership });
  } catch (err) {
    return next(err);
  }
});


/** PATCH /[userId]-[familyId] { data } => { membership }
 *
 * Data can include:
 *   { memStatus, isAdmin, primaryFamily }
 * At least one property is required
 * 
 * membership is { userId, familyId, memStatus, isAdmin, primaryFamily, createDate, modifyDate 
 **/

 router.patch("/:userId-:familyId", async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, membershipUpdateSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }

    const {userId, familyId} = req.params;
    let membership = await Membership.find(userId, familyId);

    membership = await membership.update(req.body);

    return res.json({ membership });
  } catch (err) {
    return next(err);
  }
});


/** DELETE /[userId]-[familyId]  =>  { deleted: userId-familyId }
 **/
 router.delete("/:userId-:familyId", async function (req, res, next) {
  try {
    const {userId, familyId} = req.params;
    const membership = await Membership.find(userId, familyId);

    await membership.remove();
    return res.json({ deleted: `${userId}-${familyId}` });
  } catch (err) {
    return next(err);
  }
});


module.exports = router;
