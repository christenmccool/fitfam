"use strict";

/** Haadle common authorization tasks in routes */

const jwt = require("jsonwebtoken");
const { SECRET_KEY } = require("../config");
const { UnauthorizedError, ForbiddenError } = require("../expressError");

const Membership = require("../models/membership");

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

/** Require user to be logged in as admin
 *
 * Otherwise raises ForbiddenError
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

/** Require user to be logged in as admin or to be logged in as the user matching the route parameter
 *
 * Otherwise raises ForbiddenError
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

/** Require user to be logged in as admin or to be a member of the family matching the route parameter
 *
 * Otherwise raises ForbiddenError
 */
 async function ensureOwnFamilyorAdmin(req, res, next) {
  try {
    const user = res.locals.user;
    let { familyId } = req.params;
    familyId = +familyId;

    let userFamilies = await Membership.findAll( {userId: user.userId});
    let userFamilyIds = userFamilies.map(ele => ele.familyId);
    let isFamilyMember = userFamilyIds.includes(familyId);

    if (!(user && (user.isAdmin || isFamilyMember ))) {
      throw new ForbiddenError(`Access to admin and members of family ${familyId} only`);
    }
    return next();
  } catch (err) {
    return next(err);
  }
}

/** Request body can only contain own userId and familyId of own family   
 *
 * Otherwise raises ForbiddenError
 */
 async function ensureValidReqBody(req, res, next) {
  try {
    const user = res.locals.user;

    if (user && user.isAdmin) return next();

    let {userId} = req.body;
    if (userId !== undefined) {
      if (!(user && user.userId === userId)) {
        throw new ForbiddenError(`Access to admin and user ${userId} only`);
      }
    }

    let {familyId} = req.body;
    if (familyId !== undefined) {
      let userFamilies = await Membership.findAll( {userId: user.userId});
      let userFamilyIds = userFamilies.map(ele => ele.familyId);
      let isFamilyMember = userFamilyIds.includes(familyId);
  
      if (!(user && isFamilyMember)) {
        throw new ForbiddenError(`Access to admin and members of family ${familyId} only`);
      }
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
  ensureOwnFamilyorAdmin,
  ensureValidReqBody
};
