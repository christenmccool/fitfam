/** Family class. */

const db = require("../db");
const { NotFoundError } = require("../expressError");

class Family {
  constructor({ id, familyname, imageUrl, bio, creationDate, users }) {
    this.id = id;
    this.familyname = familyname;
    this.imageUrl = imageUrl;
    this.bio = bio;
    this.creationDate = creationDate;
    this.users;
  }

  /** Get list of users given family 
   * 
   * Returns [ username1, username2, ... ]
   **/
  async getUsers() {
    const res = await db.query(
      `SELECT uf.username
        FROM users_families uf
        JOIN users u
        ON uf.username = u.username
        WHERE family_id=$1`,
      [this.id]
    )

    return res.rows.map(ele => ele.username);
  } 

  /** Create new family
   * data must include { familyname }
   * data may include { imageUrl, bio }
   * 
   * Returns { id, familyname, image_url, bio, creationDate }
   **/
    static async create({ familyname, imageUrl, bio }) {

    const res = await db.query(
      `INSERT INTO families 
        (familyname, image_url, bio)
       VALUES ($1, $2, $3)
       RETURNING id, 
                 familyname, 
                 image_url AS "imageUrl", 
                 bio, 
                 creation_date AS "creationDate"`,
      [familyname, imageUrl, bio],
    );

    const family = res.rows[0];

    return family;
  }
  
  /** Find all families
   *
   * Returns [{ id, familyname, image_url, bio, creationDate }, ...]
   * */
  static async findAll() {
    const res = await db.query(
      `SELECT id, 
              familyname, 
              image_url AS "imageUrl", 
              bio, 
              creation_date AS "creationDate"
       FROM families`
    );
    
    return res.rows.map(ele => new Family(ele));
  }

  /** Given a family id, return data about family
   *
   * Returns [{ id, familyname, image_url, bio, creationDate }, ...]
   *
   * Throws NotFoundError if not found.
   **/
  static async find(id) {
  const res = await db.query(
    `SELECT id, 
            familyname, 
            image_url AS "imageUrl", 
            bio, 
            creation_date AS "creationDate"
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
   * Data can include:
   *   { familyname, imageUrl, bio }
   *
   * Returns { id, familyname, image_url, bio, creationDate }
   *
   * Throws NotFoundError if not found.
   */
  async update({ familyname, imageUrl, bio }) {
    let newFamilyname = familyname ? familyname : this.familyname;
    let newImageUrl = imageUrl ? imageUrl : this.imageUrl;
    let newBio = bio ? bio : this.bio;

    const res = await db.query(
      `UPDATE families 
        SET familyname=$1,
            image_url=$2, 
            bio=$3
        WHERE id = $4
        RETURNING id,
                  familyname,
                  image_url AS "imageUrl",
                  bio,
                  TO_CHAR(creation_date, 'YYYYMMDD') AS "creationDate"`,        
      [newFamilyname, newImageUrl, newBio, this.id]
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

