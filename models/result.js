/** Result class */

const db = require("../db");
const { NotFoundError } = require("../expressError");

const { buildInsertQuery, buildSelectQuery, buildUpdateQuery } = require("../utils/sql");

class Result {
  constructor({ id, userId, postId, score, notes, createDate, modifyDate, completeDate, userFirst, userLast }) {
    this.id = id;
    this.userId = userId;
    this.postId = postId;
    this.score = score;
    this.notes = notes;
    this.createDate = createDate;
    this.modifyDate = modifyDate;
    this.completeDate = completeDate;
    this.userFirst = userFirst;
    this.userLast = userLast;
  }

  /** Create new result given data, update db, return new result data
   * 
   * data must include { userId, postId }
   * data may include { score, notes, completeDate }
   *
   * Returns { id, username, postId, score, notes, createDate, completeDate, userFirst, userLast }
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
      `WITH inserted_result AS 
        (INSERT INTO results 
          ${insertClause}
          RETURNING id,
                    user_id,
                    post_id, 
                    score,
                    notes,
                    create_date,
                    complete_date )
        SELECT inserted_result.id, 
               inserted_result.user_id AS "userId", 
               inserted_result.post_id AS "postId", 
               inserted_result.score, 
               inserted_result.notes, 
               TO_CHAR(inserted_result.create_date, 'YYYYMMDD') AS "createDate",
               TO_CHAR(inserted_result.complete_date, 'YYYYMMDD') AS "completeDate",
               u.first_name AS "userFirst", 
               u.last_name AS "userLast"
        FROM inserted_result 
        JOIN users u 
          ON u.id=inserted_result.user_id`,                
      [...valuesArr]
    );

    const result = res.rows[0];

    return new Result(result);  
  }
  
  /** Find all results matching optional filtering criteria
   * Filters are postId, userId, notes
   *
   * Returns [ resutl1, result2, ... ]
   * where result is { id, userId, postId, score, notes, completeDate, userFirst, userLast }
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
      `SELECT r.id,
              r.user_id AS "userId",
              r.post_id AS "postId",
              r.score, 
              r.notes,
              TO_CHAR(r.complete_date, 'YYYYMMDD') AS "completeDate",
              u.first_name as "userFirst",
              u.last_name as "userLast"
        FROM results r
        JOIN users u
          ON u.id = r.user_id
        ${whereClause}
        ORDER BY id`,
        [...valuesArr]
    );

    return res.rows.map(ele => new Result(ele));
  }
  
  /** Return data about a workout result given result id
   *
   * Returns { id, userId, postId, score, notes, createDate, modifyDate, completeDate, userFirst, userLast }
   *
   * Throws NotFoundError if not found.
   **/
  static async find(id) {
    const res = await db.query(
      `SELECT r.id,
              r.user_id AS "userId",
              r.post_id AS "postId",
              r.score, 
              r.notes,
              TO_CHAR(r.complete_date, 'YYYYMMDD') AS "completeDate",
              TO_CHAR(r.modify_date, 'YYYYMMDD') AS "modifyDate",
              TO_CHAR(r.complete_date, 'YYYYMMDD') AS "completeDate",
              u.first_name as "userFirst",
              u.last_name as "userLast"
        FROM results r
        JOIN users u
          ON u.id = r.user_id
        WHERE r.id = $1`,
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
   * Returns { id, userId, postId, score, notes, createDate, modifyDate, completeDate, userFirst, userLast }
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
      `WITH updated_result AS 
        (UPDATE results 
          ${setClause}
          WHERE id = $${valuesArr.length + 1}
          RETURNING id,
                    user_id, 
                    post_id,
                    score, 
                    notes,
                    create_date,
                    modify_date,
                    complete_date )
        SELECT updated_result.id, 
              updated_result.user_id AS "userId", 
              updated_result.post_id AS "postId", 
              updated_result.score, 
              updated_result.notes, 
              TO_CHAR(updated_result.create_date, 'YYYYMMDD') AS "createDate",
              TO_CHAR(updated_result.modify_date, 'YYYYMMDD') AS "modifyDate",
              TO_CHAR(updated_result.complete_date, 'YYYYMMDD') AS "completeDate",
              u.first_name AS "userFirst", 
              u.last_name AS "userLast"
        FROM updated_result 
        JOIN users u 
          ON u.id=updated_result.user_id`, 
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
