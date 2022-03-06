"use strict";

/** Haadle common authorization tasks in routes */

const jwt = require("jsonwebtoken");
const { SECRET_KEY } = require("../config");
const { UnauthorizedError, ForbiddenError } = require("../expressError");

const User = require("../models/user");

/** Authenticate user
 *
 * Verify token
 * 
 * If valid, store payload on res.locals 
 *    payload is {userId, isAdmin}
 *
 */
function authenticateJWT(req, res, next) {
  try {
    const authHeader = req.headers && req.headers.authorization;
    if (authHeader) {
      const token = authHeader.replace(/^[Bb]earer /, "").trim();
      res.locals.user = jwt.verify(token, SECRET_KEY);
    }
    return next();
  } catch (err) {
    return next();
  }
}

/** Require user to be logged in to access route
 *
 * Otherwise raises Unauthorized
 */
function ensureLoggedIn(req, res, next) {
  try {
    if (!res.locals.user) throw new UnauthorizedError("Access to logged in users only");
    return next();
  } catch (err) {
    return next(err);
  }
}


/** Require user to be admin
 *
 * Otherwise raises Unauthorized
 */

function ensureAdmin(req, res, next) {
  try {
    if (!res.locals.user || !res.locals.user.isAdmin) {
      throw new ForbiddenError("Access to admin only");
    }
    return next();
  } catch (err) {
    return next(err);
  }
}

/** Require user to be logged as admin or to be the user matching the route parameter
 *
 * Otherwise raises Unauthorized
 */

function ensureCorrectUserOrAdmin(req, res, next) {
  try {
    const user = res.locals.user;
    if (!(user && (user.isAdmin || user.userId === +req.params.userId ))) {
      throw new ForbiddenError(`Access to admin and user ${req.params.userId} only`);
    }
    return next();
  } catch (err) {
    return next(err);
  }
}


module.exports = {
  authenticateJWT,
  ensureLoggedIn,
  ensureAdmin,
  ensureCorrectUserOrAdmin,
};
