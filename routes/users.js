"use strict";

/** Routes for users */

const express = require("express");

const jsonschema = require("jsonschema");
const router = express.Router();

const { BadRequestError } = require("../expressError");

const User = require("../models/user");
const userNewSchema = require("../schemas/userNew.json");
const userSearchSchema = require("../schemas/userSearch.json");
const userUpdateSchema = require("../schemas/userUpdate.json");



/** POST / { data }  => { user }
 * Create new user given user data
 *
 * data must include { email, password, firstName, lastName }
 * data may include { userStatus, imageUrl, bio }
 * 
 * user is { id, email, firstName, lastName, userStatus, imageUrl, bio, createDate, modifyDate, families }
 * families is initialized as an empty array
 * join a family with users/[id]/families route
 **/

router.post("/", async function (req, res, next) {
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
 * - userStatus
 * - bio (key word search)
 * 
 * user is { id, email, firstName, lastName, userStatus, bio }
 **/

router.get("/", async function (req, res, next) {
  try {  
    const validator = jsonschema.validate(req.query, userSearchSchema);
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


/** GET /[id] => { user }
 * Returns user data given user id
 * 
 * user is { id, email, firstName, lastName, userStatus, imageUrl, bio, createDate, modifyDate, families }
 * 
 * families is [ family1, family2, ... ]
 *    where family is { familyId, familyname, status, isAdmin, primaryFamily, createDate, modifyDate }
 **/
router.get("/:id", async function (req, res, next) {
  try {  
    const {id} = req.params;

    const user = await User.find(id);

    return res.json({ user });
  } catch (err) {
    return next(err);
  }
});


/** PATCH /[id] { data } => { user }
 *
 * Data can include:
 *   { password, firstName, lastName, userStatus, imageUrl, bio }
 * Must include at least one property
 *
 * user is { id, email, firstName, lastName, userStatus, imageUrl, bio, createDate, modifyDate }
 **/

router.patch("/:id", async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, userUpdateSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }

    const {id} = req.params;
    let user = await User.find(id);

    user = await user.update(req.body);

    return res.json({ user });
  } catch (err) {
    return next(err);
  }
});


/** DELETE /[id]  =>  { deleted: id }
 **/
router.delete("/:id", async function (req, res, next) {
  try {
    const {id} = req.params;
    const user = await User.find(id);

    await user.remove();
    return res.json({ deleted: id });
  } catch (err) {
    return next(err);
  }
});



module.exports = router;

