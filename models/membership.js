/** Membership class for users and families */

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");

const { buildInsertQuery, buildSelectQuery, buildUpdateQuery } = require("../utils/sql");

class Membership {
  constructor({ userId, familyId, memStatus, isAdmin, primaryFamily, createDate, modifyDate }) {
    this.userId = userId;
    this.familyId = familyId;
    this.memStatus = memStatus;
    this.isAdmin = isAdmin;
    this.primaryFamily = primaryFamily;
    this.createDate = createDate;
    this.modifyDate = modifyDate;
  }

  /** Create new membership given data, update db, return new memmbership data
   * 
   * data must include { userId, familyId }
   * data may include { memStatus, isAdmin, primaryFamily }
   *
   * Returns { userId, familyId, memStatus, isAdmin, primaryFamily, createDate }
   *
   * Throws BadRequestError on duplicates
   **/
  static async create(data) {
    const checkUserId = await db.query(
      `SELECT id
        FROM users
        WHERE id = $1`, 
      [data.userId]);
    const user = checkUserId.rows[0];
    if (!user) throw new NotFoundError(`No user: ${data.userId}`);

    const checkFamilyId = await db.query(
      `SELECT id
        FROM families
        WHERE id = $1`, 
      [data.familyId]);
    const family = checkFamilyId.rows[0];
    if (!family) throw new NotFoundError(`No family: ${data.familyId}`);

    const duplicateCheck = await db.query(
      `SELECT user_id, family_id
        FROM users_families
        WHERE user_id = $1 AND family_id=$2`,
      [data.userId, data.familyId]
    );

    if (duplicateCheck.rows[0]) {
      throw new BadRequestError(`User ${data.userId} is already a memeber of family: ${data.familyId}`);
    }
    
    const jstoSql = {
      userId: "user_id",
      familyId: "family_id",
      memStatus: "mem_status",
      isAdmin: "is_admin",
      primaryFamily: "primary_family"
    }

    let {insertClause, valuesArr} = buildInsertQuery(data, jstoSql);

    const res = await db.query(
      `INSERT INTO users_families 
        ${insertClause}
        RETURNING 
          user_id AS "userId",
          family_id AS "familyId",
          mem_status AS "memStatus",
          is_admin AS "isAdmin",
          primary_family AS "primaryFamily",
          TO_CHAR(create_date, 'YYYYMMDD') AS "createDate"`,             
      [...valuesArr]
    );

    const membership = res.rows[0];

    return new Membership(membership);
  }

  /** Find all memberships matching optional filtering criteria
   * Filters are userId, familyId, memStatus, isAdmin, primaryFamily
   *
   * Returns [ membership1, membership2, ... ]
   * where membership is { userId, familyId, memStatus, isAdmin, primaryFamily, createDate, modifyDate }
   **/
  static async findAll(data) {
    const jstoSql = {
      userId: "user_id",
      familyId: "family_id",
      memStatus: "mem_status",
      isAdmin: "is_admin",
      primaryFamily: "primary_family"
    }

    const compOp = {
      userId: "=",
      familyId: "=",
      memStatus: "=",
      isAdmin: "=",
      primaryFamily: "="
    }

    let {whereClause, valuesArr} = buildSelectQuery(data, jstoSql, compOp);

    const res = await db.query(
      `SELECT user_id AS "userId",
              family_id AS "familyId",
              mem_status AS "memStatus",
              is_admin AS "isAdmin",
              primary_family AS "primaryFamily",
              TO_CHAR(modify_date, 'YYYYMMDD') AS "modifyDate",       
              TO_CHAR(create_date, 'YYYYMMDD') AS "createDate"
        FROM users_families
        ${whereClause}
        ORDER BY user_id, family_id`,
      [...valuesArr]
    );
    return res.rows.map(ele => new Membership(ele));
  }

  /** Return data about membership given a user id and family id
   *
   * Returns { userId, familyId, memStatus, isAdmin, primaryFamily, createDate, modifyDate }
   *
   * Throws NotFoundError if not found
   **/
  static async find(userId, familyId) {
    const checkUserId = await db.query(
      `SELECT id
        FROM users
        WHERE id = $1`, 
      [userId]);
    const user = checkUserId.rows[0];
    if (!user) throw new NotFoundError(`No user: ${userId}`);

    const checkFamilyId = await db.query(
      `SELECT id
        FROM families
        WHERE id = $1`, 
      [familyId]);
    const family = checkFamilyId.rows[0];
    if (!family) throw new NotFoundError(`No family: ${familyId}`);
    
    const res = await db.query(
      `SELECT user_id as "userId", 
              family_id AS "familyId",
              mem_status AS "memStatus",
              is_admin AS "isAdmin",
              primary_family AS "primaryFamily",
              TO_CHAR(create_date, 'YYYYMMDD') AS "createDate",
              TO_CHAR(modify_date, 'YYYYMMDD') AS "modifyDate"
        FROM users_families
        WHERE user_id=$1 AND family_id=$2
        ORDER BY user_id, family_id`,
      [userId, familyId]
    )

    let membership = res.rows[0];

    if (!membership) throw new NotFoundError(`User ${userId} is not a member of ${familyId}`);

    return new Membership(membership);
  }

  /** Update membership data given user id and family id 
   *
   * data may include { memStatus, isAdmin, primaryFamily }
   * At least one property is required
   *
   * Returns { userId, familyId, memStatus, isAdmin, primaryFamily, createDate, modifyDate }
   *
   * Throws NotFoundError if not found.
   **/
  async update(data) {
    const jstoSql = {
      memStatus: "mem_status",
      isAdmin: "is_admin",
      primaryFamily: "primary_family"
    }

    let {setClause, valuesArr} = buildUpdateQuery(data, jstoSql);
    setClause += `, modify_date=CURRENT_TIMESTAMP `;

    const res = await db.query(
      `UPDATE users_families 
        ${setClause}
        WHERE user_id = $${valuesArr.length + 1} AND family_id = $${valuesArr.length + 2}
        RETURNING user_id as "userId", 
                  family_id AS "familyId",
                  mem_status AS "memStatus",
                  is_admin AS "isAdmin",
                  primary_family AS "primaryFamily",
                  TO_CHAR(create_date, 'YYYYMMDD') AS "createDate",
                  TO_CHAR(modify_date, 'YYYYMMDD') AS "modifyDate"`,              
      [...valuesArr, this.userId, this.familyId]
    );

    let membership = res.rows[0];

    if (!membership) throw new NotFoundError(`User ${this.userId} is not a member of ${this.familyId}`);

    return new Membership(membership);
  }

/** Delete membership 
 * 
 * Returns undefined
 **/
    async remove() {
    let res = await db.query(
      `DELETE
        FROM users_families
        WHERE user_id = $1 AND family_id=$2
        RETURNING user_id, family_id`,
      [this.userId, this.familyId],
    );
    const membership = res.rows[0];

    if (!membership) throw new NotFoundError(`User ${this.userId} is not a member of ${this.familyId}`);
  }

}


module.exports = Membership;


