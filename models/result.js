/** Result class. */

const db = require("../db");
const { NotFoundError } = require("../expressError");

const { buildResultQuery } = require("../utils/sql");

class Result {
  constructor({ id, username, familyId, workoutId, score, notes, dateCompleted }) {
    this.id = id;
    this.username = username;
    this.familyId = familyId;
    this.workoutId = workoutId;
    this.score = score;
    this.notes = notes;
    this.dateCompleted = dateCompleted;
  }

  /** Create new result
   * data must include { username, familyId, workoutId }
   * data may include { score, notes }
   *
   * Returns { id, username, familyId, workoutId, score, notes, dateCompleted }
   **/
  static async create({ username, familyId, workoutId, score, notes }) {
    const res = await db.query(
      `INSERT INTO results 
        (username, family_id, workout_id, score, notes)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id,
                  username, 
                  family_id AS "familyId",
                  workout_id AS "workoutId", 
                  score, 
                  notes,
                  TO_CHAR(date_completed, 'YYYYMMDD') AS "dateCompleted"`,
      [username, familyId, workoutId, score, notes]
    );

    const result = res.rows[0];

    return new Result(result);  
  }
  
  /** Find all results given a workoutId and/or username and/or familyId 
   *
   * Returns [{ id, username, familyId, workoutId, score, notes, dateCompleted }, ...]
   * */
   static async findAll(workoutId, username, familyId) {
    const {query, data} = buildResultQuery(workoutId, username, familyId);
    const res = await db.query(query, data);
    return res.rows.map(ele => new Result(ele));
  }
  
  /** Return data about a workout result given result id
   *
   * Returns { id, username, familyId, workoutId, score, notes, dateCompleted }
   *
   * Throws NotFoundError if not found.
   **/
  static async find(id) {
    const res = await db.query(
      `SELECT id,
              username, 
              family_id AS "familyId",
              workout_id AS "workoutId", 
              score, 
              notes,
              TO_CHAR(date_completed, 'YYYYMMDD') AS "dateCompleted"
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
   *   { score, notes, date }
   *
   * Returns { id, username, familyId, workoutId, score, notes, dateCompleted }
   *
   * Throws NotFoundError if not found.
   */
  async update({ score, notes, dateCompleted }) {
    let newScore = score ? score : this.score;
    let newNotes = notes ? notes : this.notes;
    let newDate = dateCompleted ? dateCompleted : this.dateCompleted;

    const res = await db.query(
      `UPDATE results 
        SET score=$1,
            notes=$2,
            date_completed=$3
        WHERE id = $4
        RETURNING id,
                  username, 
                  family_id AS "familyId",
                  workout_id AS "workoutId", 
                  score, 
                  notes,
                  TO_CHAR(date_completed, 'YYYYMMDD') AS "dateCompleted"`,       
      [newScore, newNotes, newDate, this.id]
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
