"use strict";

/** Routes for postings */

const express = require("express");
const jsonschema = require("jsonschema");

const router = express.Router();

const { ensureLoggedIn } = require("../middleware/auth");
const { BadRequestError, ForbiddenError } = require("../expressError");
const { verifyMembership } = require("../services/verifyMembership");

const Posting = require("../models/posting");
const postingNewSchema = require("../schemas/postingNew.json");
const postingSearchSchema = require("../schemas/postingSearch.json");
const postingUpdateSchema = require("../schemas/postingUpdate.json");

/** POST / { data }  => { posting }
 *
 * data must include { familyId, workoutId }
 * data may include { postDate, postBy }
 * 
 * posting is { id, familyId, workoutId, createDate, postDate, postBy }
 **/
 router.post("/", ensureLoggedIn, async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, postingNewSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }

    const {postBy} = req.body;
    if (postBy) {
      //user may only post as themselves
      if (!(res.locals.user.userId === postBy)) {
        throw new ForbiddenError(`A user can only post as themselves`);
      }
      //user may only post to a family they are a member of
      const {familyId} = req.body;
      const isMember = await verifyMembership(postBy, familyId);
      if (!res.locals.user.isAdmin && !isMember) {
        throw new ForbiddenError(`User can only post to own families`);
      }
    }

    const posting = await Posting.create(req.body);
    return res.status(201).json({ posting });
  } catch (err) {
    return next(err);
  }
});


/** GET / => { postings: [ { posting1, posting2, ... } ] }
 * Returns a list of postings
 * 
 * Search filters:
 * - workoutId
 * - familyId
 * - postDate
 * - postBy
 * 
 * posting is { id, familyId, workoutId, postDate, postBy }
 **/
 router.get("/", ensureLoggedIn, async function (req, res, next) {
  try {  
    const query = req.query;
    if (query.familyId !== undefined) query.familyId = +query.familyId;
    if (query.workoutId !== undefined) query.workoutId = +query.workoutId;
    if (query.postBy !== undefined) query.postBy = +query.postBy;

    const validator = jsonschema.validate(query, postingSearchSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }

    const postings = await Posting.findAll(query);

    return res.json({ postings });
  } catch (err) {
    return next(err);
  }
});


/** GET /[id] => { posting }
 * Returns posting data given posting id
 * 
 * posting is { id, familyId, workoutId, createDate, modifyDate, postDate, postBy }
 **/
 router.get("/:id", ensureLoggedIn, async function (req, res, next) {
  try {  
    const {id} = req.params;
    
    const posting = await Posting.find(id);

    return res.json({ posting });
  } catch (err) {
    return next(err);
  }
});


/** PATCH /[id] { data } => { posting }
 *
 * Data may include:
 *   { postDate }
 *
 * posting is { id, familyId, workoutId, createDate, modifyDate, postDate, postBy }
 **/

 router.patch("/:id", ensureLoggedIn, async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, postingUpdateSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }

    const {id} = req.params;
    let posting = await Posting.find(id);

    posting = await posting.update(req.body);

    return res.json({ posting });
  } catch (err) {
    return next(err);
  }
});


/** DELETE /[id]  =>  { deleted: id }
 **/
 router.delete("/:id", ensureLoggedIn, async function (req, res, next) {
  try {
    const {id} = req.params;
    let posting = await Posting.find(id);

    await posting.remove();
    return res.json({ deleted: id });
  } catch (err) {
    return next(err);
  }
});


module.exports = router;


