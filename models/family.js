/** Family class. */

const db = require("../db");
const { NotFoundError } = require("../expressError");

const { buildUpdateQuery } = require("../utils/sql");

class Family {
  constructor({ id, familyName, imageUrl, bio, createDate, modifyDate, users }) {
    this.id = id;
    this.familyName = familyName;
    this.imageUrl = imageUrl;
    this.bio = bio;
    this.createDate = createDate;
    this.modifyDate = modifyDate;
    this.users;
  }

  /** Create new family
   * data must include { familyName }
   * data may include { imageUrl, bio }
   * 
   * Returns { id, familyName, imageUrl, bio, createDate }
   **/
  static async create({ familyName, imageUrl, bio }) {
    const res = await db.query(
      `INSERT INTO families 
        (family_name, image_url, bio)
       VALUES ($1, $2, $3)
       RETURNING id, 
                 family_name AS "familyName", 
                 image_url AS "imageUrl", 
                 bio, 
                 TO_CHAR(create_date, 'YYYYMMDD') AS "createDate"`,
      [familyName, imageUrl, bio],
    );

    const family = res.rows[0];

    return new Family(family);
  }
  
  /** Find all families
   *
   * Returns [{ id, familyName, imageUrl, bio, createDate, modifyDate }, ...]
   * */
  static async findAll() {
    const res = await db.query(
      `SELECT id, 
              family_name AS "familyName", 
              image_url AS "imageUrl", 
              bio, 
              TO_CHAR(create_date, 'YYYYMMDD') AS "createDate",
              TO_CHAR(modify_date, 'YYYYMMDD') AS "modifyDate"
       FROM families`
    );
    
    return res.rows.map(ele => new Family(ele));
  }

  /** Given a family id, return data about family
   *
   * Returns { id, familyName, imageUrl, bio, createDate, modifyDate, users }
   * 
   * users is [ userId1, userId2, ... } ]
   *
   * Throws NotFoundError if not found.
   **/
  static async find(id) {
  const res = await db.query(
    `SELECT id, 
            family_name AS "familyName", 
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

  family = new Family(family);
  const users = await family.getUsers();
  family.users = users;

  return family;
  }

  /** Update family data 
   *
   * Data may include:
   *   { familyName, imageUrl, bio }
   *
   * Returns { id, familyName, imageUrl, bio, createDate, modifyDate }
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

  /** Get list of users given family 
 * 
 * Returns [ userId1, userId2, ... ]
 **/
  async getUsers() {
    const res = await db.query(
      `SELECT u.id AS "userId"
        FROM users_families uf
        JOIN users u
        ON uf.user_id = u.id
        WHERE family_id=$1`,
      [this.id]
    )

    return res.rows.map(ele => ele.userId);
  } 
}

module.exports = Family;

