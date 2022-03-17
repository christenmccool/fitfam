/** Family class. */

const db = require("../db");
const { NotFoundError } = require("../expressError");

const { buildInsertQuery, buildSelectQuery, buildUpdateQuery } = require("../utils/sql");

class Family {
  constructor({ id, familyName, joinCode, imageUrl, bio, createDate, modifyDate, users }) {
    this.id = id;
    this.familyName = familyName;
    this.joinCode = joinCode;
    this.imageUrl = imageUrl;
    this.bio = bio;
    this.createDate = createDate;
    this.modifyDate = modifyDate;
    this.users = users;
  }

  /** Create new family given data, update db, return new family data
   * 
   * data must include { familyName }
   * data may include { imageUrl, bio }
   * 
   * Returns { id, familyName, imageUrl, bio, createDate }
   **/
  static async create(data) {
    const jstoSql = {
      familyName: "family_name",
      joinCode: "join_code",
      imageUrl: "image_url",
      bio: "bio"
    }

    let {insertClause, valuesArr} = buildInsertQuery(data, jstoSql);

    const res = await db.query(
      `INSERT INTO families 
        ${insertClause}
        RETURNING id, 
                  family_name AS "familyName", 
                  join_code AS "joinCode", 
                  image_url AS "imageUrl", 
                  bio,                   
                  TO_CHAR(create_date, 'YYYYMMDD') AS "createDate"`,           
      [...valuesArr]
    );

    const family = res.rows[0];

    return new Family(family);
  }
  

  /** Find all families matching optional filtering criteria
   * Filters are familyName, joinCode, bio
   *
   * Returns [ family1, family2, ... ]
   * where family is { id, familyName, joinCode, imageUrl, bio }
   **/
  static async findAll(data) {
    const jstoSql = {
      familyName: "family_name",
      joinCode: "join_code",
      bio: "bio"
    }

    const compOp = {
      familyName: "ILIKE",
      joinCode: "=",
      bio: "ILIKE"
    }

    let {whereClause, valuesArr} = buildSelectQuery(data, jstoSql, compOp);

    const res = await db.query(
      `SELECT id, 
              family_name AS "familyName", 
              join_code AS "joinCode", 
              image_url AS "imageUrl", 
              bio 
        FROM families
        ${whereClause}
        ORDER BY id`,
      [...valuesArr]
    );
    
    return res.rows.map(ele => new Family(ele));
  }

  /** Given a family id, return data about family
   *
   * Returns { id, familyName, joinCode, imageUrl, bio, createDate, modifyDate, users }
   * users is [ user1, user2, ... } ]
   *    where user is { userId, firstName, lastName }
   *
   * Throws NotFoundError if not found.
   **/
  static async find(id) {
    const res = await db.query(
      `SELECT id, 
              family_name AS "familyName", 
              join_code AS "joinCode", 
              image_url AS "imageUrl", 
              bio, 
              TO_CHAR(create_date, 'YYYYMMDD') AS "createDate",
              TO_CHAR(modify_date, 'YYYYMMDD') AS "modifyDate"
        FROM families
        WHERE id = $1`,
        [id]
    );

    let family = res.rows[0];

    if (!family) throw new NotFoundError(`No family: ${id}`);

    const userRes = await db.query(
      `SELECT u.id AS "userId",
              u.first_name AS "firstName",
              u.last_name AS "lastName"
        FROM users_families uf
        JOIN users u
        ON uf.user_id = u.id
        WHERE family_id=$1`,
      [id]
    );
        
    let users = userRes.rows;

    return new Family( {...family, users} );
  }

  /** Update family data 
   *
   * Data may include:
   *   { familyName, imageUrl, bio }
   *
   * Returns { id, familyName, joinCode, imageUrl, bio, createDate, modifyDate }
   *
   * Throws NotFoundError if not found.
   */
  async update(data) {
    const jstoSql = {
      familyName: "family_name",
      imageUrl: "image_url",
      bio: "bio"
    }
    let {setClause, valuesArr} = buildUpdateQuery(data, jstoSql);
    setClause += `, modify_date=CURRENT_TIMESTAMP `;

    const res = await db.query(
      `UPDATE families 
        ${setClause}
        WHERE id = $${valuesArr.length + 1}
        RETURNING id,
                  family_name AS "familyName",
                  join_code AS "joinCode", 
                  image_url AS "imageUrl",
                  bio,
                  TO_CHAR(create_date, 'YYYYMMDD') AS "createDate",  
                  TO_CHAR(modify_date, 'YYYYMMDD') AS "modifyDate"`,              
      [...valuesArr, this.id]
    );

    const family = res.rows[0];

    if (!family) throw new NotFoundError(`No family: ${this.id}`);

    return new Family(family);
  }

  /** Delete family 
  * 
  * Returns undefined
  **/
  async remove() {
    let res = await db.query(
      `DELETE
        FROM families
        WHERE id = $1
        RETURNING id`,
      [this.id],
    );
    const family = res.rows[0];

    if (!family) throw new NotFoundError(`No family: ${this.id}`);
  }

}

module.exports = Family;

