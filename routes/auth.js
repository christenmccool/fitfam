"use strict";

/** Routes for authentication */

const express = require("express");
const jwt = require("jsonwebtoken");

const { SECRET_KEY } = require("../config");

const jsonschema = require("jsonschema");
const router = new express.Router();

const { BadRequestError } = require("../expressError");

const User = require("../models/user");
const userLoginSchema = require("../schemas/userLogin.json");
const userRegisterSchema = require("../schemas/userRegister.json");


/** POST /auth/login  { email, password } => { token }
 *
 * Returns JWT token where token payload is {userId, isAdmin}
 *
 * Authorization required: none
 */
 router.post("/login", async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, userLoginSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }

    const { email, password } = req.body;

    const user = await User.authenticate(email, password);
    
    const payload = {userId: user.id, isAdmin: user.isAdmin};
    const token =  jwt.sign(payload, SECRET_KEY);
    return res.json({ token });
    
  } catch (err) {
    return next(err);
  }
});


/** POST /auth/register   { data } => { token }
 *
 * data must include { email, password, firstName, lastName }
 *
 * Returns JWT token where token payload is {userId, isAdmin}
 *
 * Authorization required: none
 */

router.post("/register", async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, userRegisterSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }

    const user = await User.create({ ...req.body, isAdmin: false });
    const payload = {userId: user.id, isAdmin: user.isAdmin};
    const token =  jwt.sign(payload, SECRET_KEY);
    return res.status(201).json({ token });
  } catch (err) {
    return next(err);
  }
});


module.exports = router;
