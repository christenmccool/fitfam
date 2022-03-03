"use strict";

/** Routes for users. */

const express = require("express");

const jsonschema = require("jsonschema");
const router = express.Router();

const { BadRequestError } = require("../expressError");

const User = require("../models/user");
const Result = require("../models/result");
const userNewSchema = require("../schemas/userNew.json");
const userUpdateSchema = require("../schemas/userUpdate.json");
const usersFamiliesUpdateSchema = require("../schemas/usersFamiliesUpdate.json");


/** POST / { data }  => { user }
 *
 * data must include { username, password, email, firstName, lastName }
 * data may include { imageUrl, bio }
 * 
 * user is { username, email, firstName, lastName, imageUrl, bio, joinDate }
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


/** GET / => { users: [ { user1, user2, ... } ] }
 * Returns a list of users
 * 
 * user is { username, email, firstName, lastName, imageUrl, bio, joinDate }
 **/

 router.get("/", async function (req, res, next) {
  try {  
    const users = await User.findAll();

    return res.json({ users });
  } catch (err) {
    return next(err);
  }
});


/** GET /[username] => { user }
 * Returns user data given username
 * 
 * user is { username, email, firstName, lastName, imageUrl, bio, joinDate, families }
 * 
 * families is [ {id1, familyname1}, {id2, familyname2}, ... } ]
 **/
 router.get("/:username", async function (req, res, next) {
  try {  
    const {username} = req.params;

    const user = await User.find(username);

    return res.json({ user });
  } catch (err) {
    return next(err);
  }
});


/** PATCH /[username] { data } => { user }
 *
 * Data can include:
 *   { email, password, firstName, lastName, imageUrl, bio }
 *
 * Returns { username, email, firstName, lastName, imageUrl, bio, joinDate }
 **/

 router.patch("/:username", async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, userUpdateSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }

    const {username} = req.params;
    let user = await User.find(username);

    user = await user.update(req.body);

    return res.json({ user });
  } catch (err) {
    return next(err);
  }
});


/** DELETE /[username]  =>  { deleted: username }
 **/
 router.delete("/:username", async function (req, res, next) {
  try {
    const {username} = req.params;
    const user = await User.find(username);

    await user.remove();
    return res.json({ deleted: username });
  } catch (err) {
    return next(err);
  }
});


/** POST /[username]/families/[familyId] => { familyStatus }
 * 
 * familyStatus is {familyId, status, isAdmin, primaryFamily, joinDate} 
 **/
 router.post("/:username/families/:familyId", async function (req, res, next) {
  try {  
    let {username, familyId} = req.params;
    familyId = +familyId;
    const user = await User.find(username);

    const familyStatus = await user.joinFamily(familyId);

    return res.json({ familyStatus });
  } catch (err) {
    return next(err);
  }
});


/** GET /[username]/families => { families: [ family1, family2, ... ] }
 * Returns list of families given username
 * 
 * family is {familyId, familyname, status, isAdmin, primaryFamily, joinDate}
 **/
 router.get("/:username/families", async function (req, res, next) {
  try {  
    const {username} = req.params;
    const user = await User.find(username);

    const families = await user.findFamilies();

    return res.json({ families });
  } catch (err) {
    return next(err);
  }
});


/** GET /[username]/families/[familyId] => { familyStatus }
 * 
 * familyStatus is {familyId, status, isAdmin, primaryFamily, joinDate} 
 **/
 router.get("/:username/families/:familyId", async function (req, res, next) {
  try {  
    const {username, familyId} = req.params;
    const user = await User.find(username);

    const familyStatus = await user.findFamilyStatus(familyId);

    return res.json({ familyStatus });
  } catch (err) {
    return next(err);
  }
});


/** PATCH /[username]/families/[familyId] {data} => { updatedStatus }
 *  data may include { status, isAdmin, primaryFamily }
 * 
 * updatedStatus is {familyId, status, isAdmin, primaryFamily, joinDate} 
 **/
 router.patch("/:username/families/:familyId", async function (req, res, next) {
  try {  
    const validator = jsonschema.validate(req.body, usersFamiliesUpdateSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }

    let {username, familyId} = req.params;
    familyId = +familyId;
    const user = await User.find(username);

    const updatedStatus = await user.updateFamilyStatus(familyId, req.body);

    return res.json({ updatedStatus });
  } catch (err) {
    return next(err);
  }
});


/** GET /[username]/results => { results: [ { result1, result2, ... } ] }
 * Returns list of results given username
 * 
 * result is { id, username, familyId, workoutId, score, notes, dateCompleted }
 **/
//  router.get("/:username/results", async function (req, res, next) {
//   try {  
//     const {username} = req.params;

//     const results = await Result.findAll(null, username, null);

//     return res.json({ results });
//   } catch (err) {
//     return next(err);
//   }
// });


/** GET /[username]/workouts/[workoutId]/results => { results: [ { result1, result2, ... } ] }
 * Returns list of results given username and workout id
 * 
 * result is { id, username, familyId, workoutId, score, notes, dateCompleted }
 **/
//  router.get("/:username/workouts/:workoutId/results", async function (req, res, next) {
//   try {  
//     const {username, workoutId} = req.params;

//     const results = await Result.findAll(workoutId, username, null);

//     return res.json({ results });
//   } catch (err) {
//     return next(err);
//   }
// });


module.exports = router;

