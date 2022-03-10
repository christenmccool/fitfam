/** Result class */

const db = require("../db");
const { NotFoundError } = require("../expressError");

const { buildInsertQuery, buildSelectQuery, buildUpdateQuery } = require("../utils/sql");

class Result {
  constructor({ id, userId, postId, score, notes, createDate, modifyDate, completeDate }) {
    this.id = id;
    this.userId = userId;
    this.postId = postId;
    this.score = score;
    this.notes = notes;
    this.createDate = createDate;
    this.modifyDate = modifyDate;
    this.completeDate = completeDate;
  }

  /** Create new result given data, update db, return new result data
   * 
   * data must include { userId, postId }
   * data may include { score, notes, completeDate }
   *
   * Returns { id, username, postId, score, notes, createDate, completeDate }
   **/
  static async create(data) {
    const jstoSql = {
      userId: "user_id",
      postId: "post_id",
      score: "score",
      notes: "notes",
      completeDate: "complete_date"
    }

    let {insertClause, valuesArr} = buildInsertQuery(data, jstoSql);

    const res = await db.query(
      `INSERT INTO results 
        ${insertClause}
        RETURNING id,
                  user_id AS "userId",
                  post_id AS "postId",
                  score, 
                  notes,
                  TO_CHAR(create_date, 'YYYYMMDD') AS "createDate",
                  TO_CHAR(complete_date, 'YYYYMMDD') AS "completeDate"`,        
      [...valuesArr]
    );

    const result = res.rows[0];

    return new Result(result);  
  }
  
  /** Find all results matching optional filtering criteria
   * Filters are postId, userId, score, notes
   *
   * Returns [ resutl1, result2, ... ]
   * where result is { id, userId, postId, score, notes, completeDate }
   * */
  static async findAll(data) {
    const jstoSql = {
      userId: "user_id",
      postId: "post_id",
      score: "score",
      notes: "notes"
    }

    const compOp = {
      userId: "=",
      postId: "=",
      score: "=",
      notes: "ILIKE"
    }

    let {whereClause, valuesArr} = buildSelectQuery(data, jstoSql, compOp);

    let res = await db.query(
      `SELECT id,
              user_id AS "userId",
              post_id AS "postId",
              score, 
              notes,
              TO_CHAR(complete_date, 'YYYYMMDD') AS "completeDate"
        FROM results
        ${whereClause}
        ORDER BY id`,
        [...valuesArr]
    );

    return res.rows.map(ele => new Result(ele));
  }
  
  /** Return data about a workout result given result id
   *
   * Returns { id, userId, postId, score, notes, createDate, modifyDate, completeDate }
   *
   * Throws NotFoundError if not found.
   **/
  static async find(id) {
    const res = await db.query(
      `SELECT id,
              user_id AS "userId", 
              post_id AS "postId",
              score, 
              notes,
              TO_CHAR(create_date, 'YYYYMMDD') AS "createDate",
              TO_CHAR(modify_date, 'YYYYMMDD') AS "modifyDate",
              TO_CHAR(complete_date, 'YYYYMMDD') AS "completeDate"
        FROM results
        WHERE id = $1`,
        [id]
    );
  
    const result = res.rows[0];
    if (!result) throw new NotFoundError(`No workout result: ${id}`);

    return new Result(result);  
  }

  /** Update result data 
   *
   * Data may include:
   *   { score, notes, completeDate }
   *
   * Returns { id, userId, postId, score, notes, createDate, modifyDate, completeDate }
   *
   * Throws NotFoundError if not found.
   */
  async update(data) {
    const jstoSql = {
      score: "score",
      notes: "notes",
      completeDate: "complete_date"
    }
    
    let {setClause, valuesArr} = buildUpdateQuery(data, jstoSql);
    setClause += `, modify_date=CURRENT_TIMESTAMP `;

    const res = await db.query(
      `UPDATE results 
        ${setClause}
        WHERE id = $${valuesArr.length + 1}
        RETURNING id,
                  user_id AS "userId", 
                  post_id AS "postId",
                  score, 
                  notes,
                  TO_CHAR(create_date, 'YYYYMMDD') AS "createDate",
                  TO_CHAR(modify_date, 'YYYYMMDD') AS "modifyDate",
                  TO_CHAR(complete_date, 'YYYYMMDD') AS "completeDate"`,              
      [...valuesArr, this.id]
    );

    const result = res.rows[0];

    if (!result) throw new NotFoundError(`No result: ${this.id}`);

    return new Result(result);
  }
  
  /** Delete result 
   * 
   * Returns undefined
   */
  async remove() {
    let res = await db.query(
      `DELETE
        FROM results
        WHERE id = $1
        RETURNING id`,
      [this.id],
    );
    const result = res.rows[0];

    if (!result) throw new NotFoundError(`No result: ${this.id}`);
  }
}

module.exports = Result;
