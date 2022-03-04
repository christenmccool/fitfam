/** Result class. */

const db = require("../db");
const { NotFoundError } = require("../expressError");

const { buildResultQuery, buildUpdateQuery } = require("../utils/sql");

class Result {
  constructor({ id, userId, familyId, workoutId, score, notes, createDate, modifyDate, completeDate }) {
    this.id = id;
    this.userId = userId;
    this.familyId = familyId;
    this.workoutId = workoutId;
    this.score = score;
    this.notes = notes;
    this.createDate = createDate;
    this.modifyDate = modifyDate;
    this.completeDate = completeDate;
  }

  /** Create new result
   * data must include { userId, familyId, workoutId }
   * data may include { score, notes, completeDate }
   *
   * Returns { id, username, familyId, workoutId, score, notes, createDate, completeDate }
   **/
  static async create({ userId, familyId, workoutId, score, notes, completeDate }) {
    const res = await db.query(
      `INSERT INTO results 
        (user_id, family_id, workout_id, score, notes, complete_date)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id,
                  user_id AS "userId",
                  family_id AS "familyId",
                  workout_id AS "workoutId", 
                  score, 
                  notes,
                  TO_CHAR(create_date, 'YYYYMMDD') AS "createDate",
                  TO_CHAR(complete_date, 'YYYYMMDD') AS "completeDate"`,

      [userId, familyId, workoutId, score, notes, completeDate]
    );

    const result = res.rows[0];

    return new Result(result);  
  }
  
  /** Find all results given a workoutId and/or userId and/or familyId 
   *
   * Returns [{ id, userId, familyId, workoutId, score, notes, createDate, modifyDate, completeDate }, ...]
   * */
  static async findAll(workoutId, userId, familyId) {
    const {query, data} = buildResultQuery(workoutId, userId, familyId);
    const res = await db.query(query, data);
    return res.rows.map(ele => new Result(ele));
  }
  
  /** Return data about a workout result given result id
   *
   * Returns { id, userId, familyId, workoutId, score, notes, createDate, modifyDate, completeDate }
   *
   * Throws NotFoundError if not found.
   **/
  static async find(id) {
    const res = await db.query(
      `SELECT id,
              user_id AS "userId", 
              family_id AS "familyId",
              workout_id AS "workoutId", 
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
   * Returns { id, userId, familyId, workoutId, score, notes, createDate, modifyDate, completeDate }
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
                  family_id AS "familyId",
                  workout_id AS "workoutId", 
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
