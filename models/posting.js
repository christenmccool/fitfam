/** Result class */

const db = require("../db");
const { NotFoundError } = require("../expressError");

const { buildInsertQuery, buildSelectQuery, buildUpdateQuery } = require("../utils/sql");

class Posting {
  constructor({ id, familyId, workoutId, createDate, modifyDate, postDate, postBy, woName, woDescription }) {
    this.id = id;
    this.familyId = familyId;
    this.workoutId = workoutId;
    this.createDate = createDate;
    this.modifyDate = modifyDate;
    this.postDate = postDate;
    this.postBy = postBy;
    this.woName = woName;
    this.woDescription = woDescription;
  }

  /** Create new posting given data, update db, return new posting data
   * 
   * data must include { familyId, workoutId }
   * data may include { postDate, postBy }
   *
   * Returns { id, familyId, workoutId, createDate, postDate, postBy, woName, woDescription }
   **/
  static async create(data) {
    const jstoSql = {
      familyId: "family_id",
      workoutId: "wo_id",
      postDate: "post_date",
      postBy: "post_by"
    }

    let {insertClause, valuesArr} = buildInsertQuery(data, jstoSql);

    const res = await db.query(
      `WITH inserted_posting AS 
        (INSERT INTO postings 
          ${insertClause}
          RETURNING id,
                    family_id,
                    wo_id, 
                    create_date,
                    post_date,
                    post_by )
        SELECT inserted_posting.id, 
               inserted_posting.family_id AS "familyId", 
               inserted_posting.wo_id AS "workoutId", 
               TO_CHAR(inserted_posting.create_date, 'YYYYMMDD') AS "createDate",
               TO_CHAR(inserted_posting.post_date, 'YYYYMMDD') AS "postDate",
               w.wo_name AS "woName", 
               w.wo_description AS "woDescription" 
        FROM inserted_posting 
        JOIN workouts w 
          ON w.id=inserted_posting.wo_id`,                
      [...valuesArr]
    );

    const posting = res.rows[0];

    return new Posting(posting);  
  }
  
  /** Find all results matching optional filtering criteria
   * Filters are workoutId, userId, familyId, score, notes
   *
   * Returns [ resutl1, result2, ... ]
   * where result is { id, userId, familyId, workoutId, score, notes, completeDate, workoutName }
   * */
  static async findAll(data) {
    const jstoSql = {
      familyId: "family_id",
      workoutId: "wo_id",
      postDate: "post_date",
      postBy: "post_by"
    }

    const compOp = {
      familyId: "=",
      workoutId: "=",
      postDate: "date",
      postBy: "="
    }

    let {whereClause, valuesArr} = buildSelectQuery(data, jstoSql, compOp);

    let res = await db.query(
        `SELECT p.id,
          p.family_id AS "familyId",
          p.wo_id AS "workoutId", 
          w.wo_name AS "woName", 
          w.wo_description AS "woDescription", 
          TO_CHAR(p.post_date, 'YYYYMMDD') AS "postDate",
          p.post_by AS "postBy"
        FROM postings p
        JOIN workouts w
          ON w.id = p.wo_id
        ${whereClause}
        ORDER BY id`,
        [...valuesArr]
    );

    return res.rows.map(ele => new Posting(ele));
  }
  
  /** Return data about a posting given posting id
   *
   * Returns { id, familyId, workoutId, createDate, modifyDate, postDate, postBy, woName, woDescription }
   *
   * Throws NotFoundError if not found.
   **/
  static async find(id) {
    const res = await db.query(
      `SELECT p.id,
        p.family_id AS "familyId",
        p.wo_id AS "workoutId", 
        w.wo_name AS "woName", 
        w.wo_description AS "woDescription", 
        TO_CHAR(p.post_date, 'YYYYMMDD') AS "postDate",
        p.post_by AS "postBy"
      FROM postings p
      JOIN workouts w
        ON w.id = p.wo_id
      WHERE p.id = $1`,
      [id]
    );
  
    const posting = res.rows[0];
    if (!posting) throw new NotFoundError(`No posting: ${id}`);

    return new Posting(posting);  
  }

  /** Update posting data 
   *
   * Data must include:
   *   { postDate }
   *
   * Returns { id, familyId, workoutId, createDate, modifyDate, postDate, postBy }
   *
   * Throws NotFoundError if not found.
   */
  async update(data) {
    const jstoSql = {
      postDate: "post_date"
    }
    
    let {setClause, valuesArr} = buildUpdateQuery(data, jstoSql);
    setClause += `, modify_date=CURRENT_TIMESTAMP `;

    const res = await db.query(
      `UPDATE postings 
        ${setClause}
        WHERE id = $${valuesArr.length + 1}
        RETURNING id,
                  family_id AS "familyId",
                  wo_id AS "workoutId", 
                  TO_CHAR(create_date, 'YYYYMMDD') AS "createDate",
                  TO_CHAR(modify_date, 'YYYYMMDD') AS "modifyDate",
                  TO_CHAR(post_date, 'YYYYMMDD') AS "postDate",
                  post_by AS "postBy"`,              
      [...valuesArr, this.id]
    );

    const posting = res.rows[0];

    if (!posting) throw new NotFoundError(`No posting: ${this.id}`);

    return new Posting(posting);
  }
  
  /** Delete posting 
   * 
   * Returns undefined
   */
  async remove() {
    let res = await db.query(
      `DELETE
        FROM postings
        WHERE id = $1
        RETURNING id`,
      [this.id],
    );
    const posting = res.rows[0];

    if (!posting) throw new NotFoundError(`No posting: ${this.id}`);
  }
}

module.exports = Posting;
