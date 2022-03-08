const Membership = require("../models/membership");

/** Verify membership
 *
 * Verify that a user is a member of family given userId and familyId
 * 
 * Returns true if user is a member of family, false otherwise
 */
 async function verifyMembership(userId, familyId) {
  try {
    let userFamilies = await Membership.findAll({ userId });
    let userFamilyIds = userFamilies.map(ele => ele.familyId);
    let isFamilyMember = userFamilyIds.includes(familyId);

    return isFamilyMember;
  } catch (err) {
    console.log(err);
  }
}

module.exports = { verifyMembership };