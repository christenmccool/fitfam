/** User class */

const db = require("../db");
const bcrypt = require("bcrypt");

const { UnauthorizedError, BadRequestError, NotFoundError } = require("../expressError");
const { BCRYPT_WORK_FACTOR } = require("../config.js");

const { buildInsertQuery, buildSelectQuery, buildUpdateQuery } = require("../utils/sql");

class User {
  constructor({ id, email, password, firstName, lastName, isAdmin, userStatus, imageUrl, bio, createDate, modifyDate, families }) {
    this.id = id;
    this.email = email;
    this.password = password;
    this.firstName = firstName;
    this.lastName = lastName;
    this.isAdmin = isAdmin;
    this.userStatus = userStatus;
    this.imageUrl = imageUrl;
    this.bio = bio;
    this.createDate = createDate;
    this.modifyDate = modifyDate;
    this.families = families;
  }

  /** authenticate user with username, password.
   *
   * Returns { id, email, firstName, lastName, userStatus }
   *
   * Throws UnauthorizedError is user not found or wrong password.
   **/
  static async authenticate(email, password) {
    const result = await db.query(
          `SELECT id, 
                  email,
                  user_password AS password,
                  first_name AS "firstName",
                  last_name AS "lastName",
                  is_admin AS "isAdmin"
           FROM users
           WHERE email = $1`,
        [email],
    );

    const user = result.rows[0];

    if (user) {
      const isValid = await bcrypt.compare(password, user.password);
      if (isValid) {
        delete user.password;    
        return new User(user);
      }
    }

    throw new UnauthorizedError("Invalid username/password");
  }

  /** Create new user given data, update db, return new user data
   * 
   * data must include { email, password, firstName, lastName }
   * data may include { isAdmin, userStatus, imageUrl, bio }
   *
   * Returns { id, email, firstName, lastName, userStatus, imageUrl, bio, createDate, modifyDate }
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

    const hashedPassword = await bcrypt.hash(data.password, BCRYPT_WORK_FACTOR);
    const dataWithHashedPassword = {...data, password: hashedPassword};

    const jstoSql = {
      email: "email",
      password: "user_password",
      firstName: "first_name",
      lastName: "last_name",
      isAdmin: "is_admin",
      userStatus: "user_status",
      imageUrl: "image_url",
      bio: "bio"
    }
    let {insertClause, valuesArr} = buildInsertQuery(dataWithHashedPassword, jstoSql);

    const res = await db.query(
      `INSERT INTO users 
        ${insertClause}
        RETURNING id, 
                  email,
                  first_name AS "firstName", 
                  last_name AS "lastName", 
                  is_admin AS "isAdmin",
                  user_status AS "userStatus",
                  image_url AS "imageUrl",
                  bio,
                  TO_CHAR(create_date, 'YYYYMMDD') AS "createDate"`,             
      [...valuesArr]
    );

    const user = res.rows[0];

    return new User(user);
  }

  /** Find all users matching optional filtering criteria
   * Filters are email, firstName, lastName, isAdmin, userStatus, bio (for key word)
   *
   * Returns [ user1, user2, ... ]
   * where user is { id, email, firstName, lastName, userStatus, bio }
   **/
  static async findAll(data) {

    const jstoSql = {
      email: "email",
      firstName: "first_name",
      lastName: "last_name",
      isAdmin: "is_admin",
      userStatus: "user_status",
      bio: "bio"
    }

    const compOp = {
      email: "ILIKE",
      firstName: "ILIKE",
      lastName: "ILIKE",
      isAdmin: "=",
      userStatus: "=",
      bio: "ILIKE"
    }

    let {whereClause, valuesArr} = buildSelectQuery(data, jstoSql, compOp);

    const res = await db.query(
      `SELECT id,
              email, 
              first_name AS "firstName",
              last_name AS "lastName",
              is_admin AS "isAdmin",
              user_status AS "userStatus",
              bio 
        FROM users
        ${whereClause}
        ORDER BY id`,
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
   * Throws NotFoundError if not found
   **/
   static async find(id) {
    const res = await db.query(
      `SELECT id, 
              email, 
              first_name AS "firstName", 
              last_name AS "lastName", 
              is_admin AS "isAdmin",
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
   * data may include:
   *   { password, firstName, lastName, userStatus, imageUrl, bio }
   * At least one property is required
   *
   * Returns { id, username, email, firstName, lastName, userStatus, imageUrl, bio, createDate, modifyDate }
   *
   * Throws NotFoundError if not found
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
                  is_admin AS "isAdmin",
                  user_status AS "userStatus",
                  image_url AS "imageUrl",
                  bio,
                  TO_CHAR(create_date, 'YYYYMMDD') AS "createDate",
                  TO_CHAR(modify_date, 'YYYYMMDD') AS "modifyDate"`,                
      [...valuesArr, this.id]
    );

    let user = res.rows[0];

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
        WHERE id = $1
        RETURNING id`,
      [this.id],
    );
    const user = res.rows[0];

    if (!user) throw new NotFoundError(`No user: ${this.id}`);
  }

}

module.exports = User;


