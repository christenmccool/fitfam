"use strict";

/** Routes for users. */

const express = require("express");

const jsonschema = require("jsonschema");
const router = express.Router();

const { BadRequestError } = require("../expressError");

const User = require("../models/user");
const userNewSchema = require("../schemas/userNew.json");
const userUpdateSchema = require("../schemas/userUpdate.json");
const usersFamiliesUpdateSchema = require("../schemas/usersFamiliesUpdate.json");


/** POST / { data }  => { user }
 *
 * data must include { email, password, firstName, lastName }
 * data may include { imageUrl, bio }
 * 
 * user is { id, email, firstName, lastName, imageUrl, bio, createDate }
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
 * user is { id, email, firstName, lastName, imageUrl, bio, createDate, modifyDate }
 **/

 router.get("/", async function (req, res, next) {
  try {  
    const users = await User.findAll();

    return res.json({ users });
  } catch (err) {
    return next(err);
  }
});


/** GET /[id] => { user }
 * Returns user data given user id
 * 
 * user is { id, email, firstName, lastName, imageUrl, bio, createDate, modifyDate, families }
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
 *   { password, firstName, lastName, imageUrl, bio }
 * Must include at least one property
 *
 * Returns { id, email, firstName, lastName, imageUrl, bio, createDate, modifyDate }
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


/** POST /[id]/families/[familyId] => { familyStatus }
 * 
 * familyStatus is {familyId, status, isAdmin, primaryFamily, createDate} 
 **/
 router.post("/:id/families/:familyId", async function (req, res, next) {
  try {  
    let {id, familyId} = req.params;
    familyId = +familyId;
    const user = await User.find(id);

    const familyStatus = await user.joinFamily(familyId);

    return res.json({ familyStatus });
  } catch (err) {
    return next(err);
  }
});


/** GET /[id]/families => { families: [ family1, family2, ... ] }
 * Returns list of families given username
 * 
 * family is { familyId, familyname, status, isAdmin, primaryFamily, createDate, modifyDate }
 **/
 router.get("/:id/families", async function (req, res, next) {
  try {  
    const {id} = req.params;
    const user = await User.find(id);

    const families = await user.findFamilies();

    return res.json({ families });
  } catch (err) {
    return next(err);
  }
});


/** GET /[id]/families/[familyId] => { familyStatus }
 * 
 * familyStatus is {familyId, status, isAdmin, primaryFamily, createDate} 
 **/
 router.get("/:id/families/:familyId", async function (req, res, next) {
  try {  
    const {id, familyId} = req.params;
    const user = await User.find(id);

    const familyStatus = await user.findFamilyStatus(familyId);

    return res.json({ familyStatus });
  } catch (err) {
    return next(err);
  }
});


/** PATCH /[id]/families/[familyId] {data} => { updatedStatus }
 *  data may include { status, isAdmin, primaryFamily }
 * 
 * updatedStatus is { familyId, status, isAdmin, primaryFamily, createDate, modifyDate } 
 **/
 router.patch("/:id/families/:familyId", async function (req, res, next) {
  try {  
    const validator = jsonschema.validate(req.body, usersFamiliesUpdateSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }

    let {id, familyId} = req.params;
    familyId = +familyId;
    const user = await User.find(id);

    const updatedStatus = await user.updateFamilyStatus(familyId, req.body);

    return res.json({ updatedStatus });
  } catch (err) {
    return next(err);
  }
});


module.exports = router;

