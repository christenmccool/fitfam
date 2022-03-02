/** User class. */

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");

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
   * families is [ {id1, familyname1}, {id2, familyname2}, ... } ]
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
   * Data can include:
   *   { password, firstName, lastName, imageUrl, bio }
   *
   * Returns { username, email, firstName, lastName, imageUrl, bio, joinDate }
   *
   * Throws NotFoundError if not found.
   **/
  async update({ password, firstName, lastName, imageUrl, bio }) {
    let newPassword = password ? password : this.password;
    let newFirstName = firstName ? firstName : this.firstName;
    let newLastName = lastName ? lastName : this.lastName;
    let newImageUrl = imageUrl ? imageUrl : this.imageUrl;
    let newBio = bio ? bio : this.bio;

    const res = await db.query(
      `UPDATE users 
       SET user_password=$1,
           first_name=$2, 
           last_name=$3, 
           image_url=$4, 
           bio=$5
       WHERE username = $6
       RETURNING username,
                 email,
                 first_name AS "firstName",
                 last_name AS "lastName",
                 image_url AS "imageUrl",
                 bio,
                 TO_CHAR(join_date, 'YYYYMMDD') AS "joinDate"`,        
      [newPassword, newFirstName, newLastName, newImageUrl, newBio, this.username]
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
   * Returns undefined
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
    if (duplicateCheck.rows[0]) return;

    const res = await db.query(
      `INSERT INTO users_families 
        (username, family_id)
      VALUES ($1, $2)
      RETURNING 
        username,
        family_id AS "familyId"`,
      [this.username, familyId]
    );
    return res.rows;
  } 

  /** Find list of families given user 
   * 
   * Returns [ {id1, familyname1}, {id2, familyname2}, ... } ]
   **/
  async findFamilies() {
    const res = await db.query(
      `SELECT uf.family_id AS "familyId",
              f.familyname
        FROM users_families uf
        JOIN families f
        ON uf.family_id = f.id
        WHERE username=$1`,
      [this.username]
    )
    return res.rows;
  }   
}

module.exports = User;

