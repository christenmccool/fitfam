/** User class. */

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");

const { buildUpdateQuery } = require("../utils/sql");

class User {
  constructor({ username, email, password, firstName, lastName, imageUrl, bio, joinDate, families }) {
    this.username = username;
    this.email = email;
    this.password = password;
    this.firstName = firstName;
    this.lastName = lastName;
    this.imageUrl = imageUrl;
    this.bio = bio;
    this.joinDate = joinDate;
    this.families = families;
  }

  /** Create new user
   * data must include { username, password, email, firstName, lastName }
   * data may include { imageUrl, bio }
   *
   * Returns { username, email, firstName, lastName, imageUrl, bio, joinDate }
   *
   * Throws BadRequestError on duplicates.
   **/
  static async create({ username, email, password, firstName, lastName, imageUrl, bio }) {
    const duplicateCheck = await db.query(
      `SELECT username
        FROM users
        WHERE username = $1`,
      [username]
    );

    if (duplicateCheck.rows[0]) {
      throw new BadRequestError(`Duplicate username: ${username}`);
    }

    const result = await db.query(
      `INSERT INTO users
          (username, email, user_password, first_name, last_name, image_url, bio)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING username, 
                  email,
                  first_name AS "firstName", 
                  last_name AS "lastName", 
                  image_url AS "imageUrl",
                  bio,
                  TO_CHAR(join_date, 'YYYYMMDD') AS "joinDate"`,
      [username, email, password, firstName, lastName, imageUrl, bio]
    );

    const user = result.rows[0];

    return new User(user);
  }

  /** Find all users.
   *
   * Returns [{ username, email, firstName, lastName, imageUrl, bio, joinDate }, ...]
   **/
  static async findAll() {
    const res = await db.query(
      `SELECT username, 
              email, 
              first_name AS "firstName", 
              last_name AS "lastName", 
              image_url AS "imageUrl",
              bio,
              TO_CHAR(join_date, 'YYYYMMDD') AS "joinDate"
        FROM users`
    );
    
    return res.rows.map(ele => new User(ele));
  }

  /** Given a username, return data about user, including families
   *
   * Returns { username, email, firstName, lastName, imageUrl, bio, joinDate, families }
   * families is [ {id1, familyname1, status1}, {id2, familyname2, status2}, ... } ]
   *
   * Throws NotFoundError if not found.
   **/
   static async find(username) {
    const res = await db.query(
      `SELECT username, 
                email, 
                first_name AS "firstName", 
                last_name AS "lastName", 
                image_url AS "imageUrl",
                bio,
                TO_CHAR(join_date, 'YYYYMMDD') AS "joinDate"
        FROM users
        WHERE username = $1`,
      [username]
    );

    let user = res.rows[0];

    if (!user) throw new NotFoundError(`No user: ${username}`);

    user = new User(user);
    const families = await user.findFamilies();
    user.families = families;

    return user;
  }

  /** Update user data 
   *
   * data can include:
   *   { email, password, firstName, lastName, imageUrl, bio }
   * At least one property is required
   *
   * Returns { email, username, email, firstName, lastName, imageUrl, bio, joinDate }
   *
   * Throws NotFoundError if not found.
   **/
  async update(data) {
    const jstoSql = {
      email: "email",
      password: "user_password",
      firstName: "first_name",
      lastName: "last_name",
      imageUrl: "image_url",
      bio: "bio"
    }
    const {setClause, valuesArr} = buildUpdateQuery(data, jstoSql);

    const res = await db.query(
      `UPDATE users 
        ${setClause}
        WHERE username = $${valuesArr.length + 1}
        RETURNING username,
                  email,
                  first_name AS "firstName",
                  last_name AS "lastName",
                  image_url AS "imageUrl",
                  bio,
                  TO_CHAR(join_date, 'YYYYMMDD') AS "joinDate"`,        
      [...valuesArr, this.username]
    );

    const user = res.rows[0];

    if (!user) throw new NotFoundError(`No user: ${this.username}`);

    return new User(user);
  }

  /** Delete user 
   * 
   * Returns undefined
   **/
  async remove() {
    let res = await db.query(
      `DELETE
        FROM users
        WHERE username = $1
        RETURNING username`,
      [this.username],
    );
    const user = res.rows[0];

    if (!user) throw new NotFoundError(`No user: ${this.username}`);
  }


  /** Join family 
   *
   * Returns {familyId, status, isAdmin, primaryFamily, joinDate}
   * where status is default value of "active"
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
      `SELECT username, family_id
        FROM users_families
        WHERE username = $1 AND family_id=$2`,
      [this.username, familyId]
    );
    if (duplicateCheck.rows[0]) {
      throw new BadRequestError(`Already a member of family: ${familyId}`);
    }
    
    const res = await db.query(
      `INSERT INTO users_families 
          (username, family_id)
        VALUES ($1, $2)
        RETURNING 
          family_id AS "familyId",
          family_status AS "status",
          is_admin AS "isAdmin",
          primary_family AS "primaryFamily",
          TO_CHAR(join_date, 'YYYYMMDD') AS "joinDate"`,
      [this.username, familyId]
    );

    return res.rows[0];
  } 

  /** Find list of families given user 
   * Returns [ family1, family2, ... ]
   * family is {familyId, familyname, status, isAdmin, primaryFamily, joinDate}
   **/
  async findFamilies() {
    const res = await db.query(
      `SELECT uf.family_id AS "familyId",
              f.familyname,
              uf.family_status AS "status",
              uf.is_admin AS "isAdmin",
              uf.primary_family AS "primaryFamily",
              TO_CHAR(join_date, 'YYYYMMDD') AS "joinDate"
        FROM users_families uf
        JOIN families f
        ON uf.family_id = f.id
        WHERE username=$1`,
      [this.username]
    )
    return res.rows;
  }   

  /** Find data about status and role of user in family 
   * 
   * Returns {familyId, status, isAdmin, primaryFamily, joinDate}
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
        WHERE username=$1 AND family_id=$2`,
      [this.username, familyId]
    )
    const family2 = checkInFamily.rows[0];

    if (!family2) throw new BadRequestError(`Not a member of family: ${familyId}`);

    const res = await db.query(
      `SELECT family_id AS "familyId",
              family_status AS "status",
              is_admin AS "isAdmin",
              primary_family AS "primaryFamily",
              TO_CHAR(join_date, 'YYYYMMDD') AS "joinDate"
        FROM users_families
        WHERE username=$1 AND family_id=$2`,
      [this.username, familyId]
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
              family_status AS status,
              is_admin AS "isAdmin",
              primary_family AS "primaryFamily"
        FROM users_families
        WHERE username=$1 AND family_id=$2`,
      [this.username, familyId]
    )
    const family2 = checkInFamily.rows[0];

    if (!family2) throw new BadRequestError(`Not a member of family: ${familyId}`);

    const jstoSql = {
      status: "family_status",
      isAdmin: "is_admin",
      primaryFamily: "primary_family"
    }
    const {setClause, valuesArr} = buildUpdateQuery(data, jstoSql);

    const res = await db.query(
      `UPDATE users_families 
        ${setClause}
        WHERE username=$${valuesArr.length + 1} AND family_id=$${valuesArr.length + 2}
        RETURNING 
          family_id AS "familyId", 
          family_status AS "status",
          is_admin AS "isAdmin",
          primary_family AS "primaryFamily",
          TO_CHAR(join_date, 'YYYYMMDD') AS "joinDate"`,        
        [...valuesArr, this.username, familyId]
    );

    return res.rows[0];
  }
}

module.exports = User;


