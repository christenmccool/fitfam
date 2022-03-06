"use strict";

/** Routes for users */

const express = require("express");

const jsonschema = require("jsonschema");
const router = express.Router();

const { ensureLoggedIn, ensureAdmin, ensureCorrectUserOrAdmin } = require("../middleware/auth");
const { BadRequestError } = require("../expressError");

const User = require("../models/user");
const userNewSchema = require("../schemas/userNew.json");
const userSearchSchema = require("../schemas/userSearch.json");
const userUpdateSchema = require("../schemas/userUpdate.json");


/** POST / { data }  => { user }
 * Create new user given user data
 *
 * data must include { email, password, firstName, lastName }
 * data may include { isAdmin, userStatus, imageUrl, bio }
 * 
 * user is { id, email, firstName, lastName, isAdmin, userStatus, imageUrl, bio, createDate }
 **/
router.post("/", ensureLoggedIn, ensureAdmin, async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, userNewSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }

    const user = await User.create(req.body);

    return res.status(201).json({ user });
  } catch (err) {
    return next(err);
  }
});


/** GET / => { users: [ user1, user2, ...] }
 * Returns a list of all users matching optional filtering criteria
 * 
 * Search filters:
 * - email
 * - firstName
 * - lastName
 * - isAdmin
 * - userStatus
 * - bio (key word search)
 * 
 * user is { id, email, firstName, lastName, isAdmin, userStatus, bio }
 **/
router.get("/", ensureLoggedIn, ensureAdmin, async function (req, res, next) {
  try {  
    const query = req.query;
    if (query.isAdmin !== undefined) query.isAdmin = query.isAdmin === "true" || query.isAdmin === "";
    
    const validator = jsonschema.validate(query, userSearchSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }

    const users = await User.findAll(req.query);

    return res.json({ users });
  } catch (err) {
    return next(err);
  }
});


/** GET /[userId] => { user }
 * Returns user data given user id
 * 
 * user is { id, email, firstName, lastName, isAdmin, userStatus, imageUrl, bio, createDate, modifyDate, families }
 * 
 * families is [ family1, family2, ... ]
 *    where family is { familyId, familyname, status, isAdmin, primaryFamily, createDate, modifyDate }
 **/
router.get("/:userId", ensureLoggedIn, ensureCorrectUserOrAdmin, async function (req, res, next) {
  try {  
    const {userId} = req.params;

    const user = await User.find(userId);

    return res.json({ user });
  } catch (err) {
    return next(err);
  }
});


/** PATCH /[userId] { data } => { user }
 *
 * Data can include:
 *   { password, firstName, lastName, userStatus, imageUrl, bio }
 * Must include at least one property
 *
 * user is { id, email, firstName, lastName, isAdmin, userStatus, imageUrl, bio, createDate, modifyDate }
 **/
router.patch("/:userId", ensureLoggedIn, ensureCorrectUserOrAdmin, async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, userUpdateSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }

    const {userId} = req.params;
    let user = await User.find(userId);

    user = await user.update(req.body);

    return res.json({ user });
  } catch (err) {
    return next(err);
  }
});


/** DELETE /[userId]  =>  { deleted: id }
 **/
router.delete("/:userId", ensureLoggedIn, ensureCorrectUserOrAdmin, async function (req, res, next) {
  try {
    const {userId} = req.params;
    const user = await User.find(userId);

    await user.remove();
    return res.json({ deleted: userId });
  } catch (err) {
    return next(err);
  }
});



module.exports = router;

