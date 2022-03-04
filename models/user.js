/** User class. */
const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");

const { buildInsertQuery, buildSelectQuery, buildUpdateQuery } = require("../utils/sql");

class User {
  constructor({ id, email, password, firstName, lastName, userStatus, imageUrl, bio, createDate, modifyDate, families=[] }) {
    this.id = id;
    this.email = email;
    this.password = password;
    this.firstName = firstName;
    this.lastName = lastName;
    this.userStatus = userStatus;
    this.imageUrl = imageUrl;
    this.bio = bio;
    this.createDate = createDate;
    this.modifyDate = modifyDate;
    this.families = families;
  }

  /** Create new user
   * data must include { email, password, firstName, lastName }
   * data may include { userStatus, imageUrl, bio }
   *
   * Returns { id, email, firstName, lastName, userStatus, imageUrl, bio, createDate, modifyDate, families }
   * where families is an empty array 
   *
   * Throws BadRequestError on duplicates
   **/
  static async create(data) {
    const duplicateCheck = await db.query(
      `SELECT email
        FROM users
        WHERE email = $1`,
      [data.email]
    );

    if (duplicateCheck.rows[0]) {
      throw new BadRequestError(`Duplicate email: ${data.email}`);
    }

    const jstoSql = {
      email: "email",
      password: "user_password",
      firstName: "first_name",
      lastName: "last_name",
      userStatus: "user_status",
      imageUrl: "image_url",
      bio: "bio"
    }
    let {insertClause, valuesArr} = buildInsertQuery(data, jstoSql);

    const res = await db.query(
      `INSERT INTO users 
        ${insertClause}
        RETURNING id, 
                  email,
                  first_name AS "firstName", 
                  last_name AS "lastName", 
                  user_status AS "userStatus",
                  image_url AS "imageUrl",
                  bio,
                  TO_CHAR(create_date, 'YYYYMMDD') AS "createDate",
                  TO_CHAR(modify_date, 'YYYYMMDD') AS "modifyDate"`,             
      [...valuesArr]
    );

    const user = res.rows[0];

    return new User(user);
  }

  /** Find all users matching optional filtering criteria
   * Filters are email, firstName, lastName, userStatus, bio (for key word)
   *
   * Returns [ user1, user2, ... ]
   * where user is { id, email, firstName, lastName, userStatus, bio }
   **/
  static async findAll(data) {
    const jstoSql = {
      email: "email",
      firstName: "first_name",
      lastName: "last_name",
      userStatus: "user_status",
      bio: "bio"
    }

    const compOp = {
      email: "ILIKE",
      firstName: "ILIKE",
      lastName: "ILIKE",
      userStatus: "=",
      bio: "ILIKE"
    }

    let {whereClause, valuesArr} = buildSelectQuery(data, jstoSql, compOp);

    const res = await db.query(
      `SELECT id,
              email, 
              first_name AS "firstName",
              last_name AS "lastName",
              user_status AS "userStatus",
              bio 
        FROM users
        ${whereClause}
        ORDER BY ID`,
      [...valuesArr]
    );

    return res.rows;
  }

  /** Given a user id, return data about user, including families
   *
   * Returns { id, email, firstName, lastName, userStatus, imageUrl, bio, createDate, modifyDate, families }
   * families is [ family1, family2, ... ]
   *    where family is { familyId, familyname, memStatus, isAdmin, primaryFamily }
   *
   * Throws NotFoundError if not found.
   **/
   static async find(id) {
    const res = await db.query(
      `SELECT id, 
              email, 
              first_name AS "firstName", 
              last_name AS "lastName", 
              user_status AS "userStatus",
              image_url AS "imageUrl",
              bio,
              TO_CHAR(create_date, 'YYYYMMDD') AS "createDate",
              TO_CHAR(modify_date, 'YYYYMMDD') AS "modifyDate"
        FROM users
        WHERE id = $1`,
      [id]
    );

    let user = res.rows[0];

    if (!user) throw new NotFoundError(`No user: ${id}`);

    const famRes = await db.query(
      `SELECT uf.family_id AS "familyId",
              f.family_name AS "familyName",
              uf.mem_status AS "memStatus",
              uf.is_admin AS "isAdmin",
              uf.primary_family AS "primaryFamily"
        FROM users_families uf
        JOIN families f
        ON uf.family_id = f.id
        WHERE uf.user_id=$1`,
      [id]
    );
        
    let families = famRes.rows;

    return new User( {...user, families} );
  }

  /** Update user data 
   *
   * data can include:
   *   { password, firstName, lastName, userStatus, imageUrl, bio }
   * At least one property is required
   *
   * Returns { id, username, email, firstName, lastName, userStatus, imageUrl, bio, createDate, modifyDate }
   *
   * Throws NotFoundError if not found.
   **/
  async update(data) {
    const jstoSql = {
      password: "user_password",
      firstName: "first_name",
      lastName: "last_name",
      userStatus: "user_status",
      imageUrl: "image_url",
      bio: "bio"
    }
    let {setClause, valuesArr} = buildUpdateQuery(data, jstoSql);
    setClause += `, modify_date=CURRENT_TIMESTAMP `;

    const res = await db.query(
      `UPDATE users 
        ${setClause}
        WHERE id = $${valuesArr.length + 1}
        RETURNING id, 
                  email,
                  first_name AS "firstName",
                  last_name AS "lastName",
                  user_status AS "userStatus",
                  image_url AS "imageUrl",
                  bio,
                  TO_CHAR(create_date, 'YYYYMMDD') AS "createDate",
                  TO_CHAR(modify_date, 'YYYYMMDD') AS "modifyDate"`,                
      [...valuesArr, this.id]
    );

    let user = res.rows[0];

    if (!user) throw new NotFoundError(`No user: ${this.username}`);

    const famRes = await db.query(
      `SELECT uf.family_id AS "familyId",
              f.family_name AS "familyName",
              uf.mem_status AS "memStatus",
              uf.is_admin AS "isAdmin",
              uf.primary_family AS "primaryFamily"
        FROM users_families uf
        JOIN families f
        ON uf.family_id = f.id
        WHERE uf.user_id=$1`,
      [this.id]
    );
        
    let families = famRes.rows;

    return new User( {...user, families} );
  }

  /** Delete user 
   * 
   * Returns undefined
   **/
  async remove() {
    let res = await db.query(
      `DELETE
        FROM users
        WHERE id = $1
        RETURNING id`,
      [this.id],
    );
    const user = res.rows[0];

    if (!user) throw new NotFoundError(`No user: ${this.id}`);
  }


  /** Join family 
   *
   * Returns {familyId, status, isAdmin, primaryFamily, createDate}
   **/
  async joinFamily(familyId) {
    const checkFamilyId = await db.query(
      `SELECT id
        FROM families
        WHERE id = $1`, 
      [familyId]);
    const family = checkFamilyId.rows[0];

    if (!family) throw new NotFoundError(`No family: ${familyId}`);

    const duplicateCheck = await db.query(
      `SELECT user_id, family_id
        FROM users_families
        WHERE user_id = $1 AND family_id=$2`,
      [this.id, familyId]
    );
    if (duplicateCheck.rows[0]) {
      throw new BadRequestError(`Already a member of family: ${familyId}`);
    }
    
    const res = await db.query(
      `INSERT INTO users_families 
          (user_id, family_id)
        VALUES ($1, $2)
        RETURNING 
          family_id AS "familyId",
          mem_status AS "memStatus",
          is_admin AS "isAdmin",
          primary_family AS "primaryFamily",
          TO_CHAR(create_date, 'YYYYMMDD') AS "createDate"`,
      [this.id, familyId]
    );

    return res.rows[0];
  } 

  /** Find list of families given user 
   * Returns [ family1, family2, ... ]
   * family is { familyId, familyname, status, isAdmin, primaryFamily, createDate, modifyDate }
   **/
  async findFamilies() {
    const res = await db.query(
      `SELECT uf.family_id AS "familyId",
              f.family_name AS "familyName",
              uf.mem_status AS "memStatus",
              uf.is_admin AS "isAdmin",
              uf.primary_family AS "primaryFamily",
              TO_CHAR(uf.create_date, 'YYYYMMDD') AS "createDate",
              TO_CHAR(uf.modify_date, 'YYYYMMDD') AS "modifyDate"
        FROM users_families uf
        JOIN families f
        ON uf.family_id = f.id
        WHERE uf.user_id=$1`,
      [this.id]
    )
    return res.rows;
  }   

  /** Find data about status and role of user in family 
   * 
   * Returns {familyId, status, isAdmin, primaryFamily, createDate, modifyDate}
   **/
  async findFamilyStatus(familyId) {
    const checkFamilyId = await db.query(
      `SELECT id
        FROM families
        WHERE id = $1`, 
      [familyId]);
    const family1 = checkFamilyId.rows[0];

    if (!family1) throw new NotFoundError(`No family: ${familyId}`);

    const checkInFamily = await db.query(
      `SELECT family_id
        FROM users_families
        WHERE user_id=$1 AND family_id=$2`,
      [this.id, familyId]
    )
    const family2 = checkInFamily.rows[0];

    if (!family2) throw new BadRequestError(`Not a member of family: ${familyId}`);

    const res = await db.query(
      `SELECT family_id AS "familyId",
              uf.mem_status AS "memStatus",
              is_admin AS "isAdmin",
              primary_family AS "primaryFamily",
              TO_CHAR(create_date, 'YYYYMMDD') AS "createDate",
              TO_CHAR(modify_date, 'YYYYMMDD') AS "modifyDate"
        FROM users_families
        WHERE user_id=$1 AND family_id=$2`,
      [this.id, familyId]
    )
    return res.rows[0];
  }  

  /** Update family status
   * data can include: { status, isAdmin, primaryFamily }
   *   At least one field is required
   *
   * Returns { familyId, status }
   **/
  async updateFamilyStatus(familyId, data) {
    const checkFamilyId = await db.query(
      `SELECT id
        FROM families
        WHERE id = $1`, 
      [familyId]);
    const family1 = checkFamilyId.rows[0];

    if (!family1) throw new NotFoundError(`No family: ${familyId}`);

    const checkInFamily = await db.query(
      `SELECT family_id,
              uf.mem_status AS "memStatus",
              is_admin AS "isAdmin",
              primary_family AS "primaryFamily"
        FROM users_families
        WHERE user_id=$1 AND family_id=$2`,
      [this.id, familyId]
    )
    const family2 = checkInFamily.rows[0];

    if (!family2) throw new BadRequestError(`Not a member of family: ${familyId}`);

    const jstoSql = {
      status: "family_status",
      isAdmin: "is_admin",
      primaryFamily: "primary_family"
    }
    let {setClause, valuesArr} = buildUpdateQuery(data, jstoSql);
    setClause += `, modify_date=CURRENT_TIMESTAMP `;

    const res = await db.query(
      `UPDATE users_families 
        ${setClause}
        WHERE user_id=$${valuesArr.length + 1} AND family_id=$${valuesArr.length + 2}
        RETURNING 
          family_id AS "familyId", 
          family_status AS "status",
          is_admin AS "isAdmin",
          primary_family AS "primaryFamily",
          TO_CHAR(create_date, 'YYYYMMDD') AS "createDate",
          TO_CHAR(modify_date, 'YYYYMMDD') AS "modifyDate"`,        
        [...valuesArr, this.id, familyId]
    );
    return res.rows[0];
  }
}

module.exports = User;


