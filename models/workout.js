/** Workout class */

const db = require("../db");
const { NotFoundError } = require("../expressError");

const { buildInsertQuery, buildSelectQuery, buildUpdateQuery } = require("../utils/sql");


/** Workout in the database. */

class Workout {
  constructor({ id, swId, name, description, scoreType, category, createDate, modifyDate, publishDate }) {
    this.id = id;
    this.swId = swId;
    this.name = name;
    this.description = description;
    this.scoreType = scoreType;
    this.category = category;
    this.createDate = createDate;
    this.modifyDate = modifyDate;
    this.publishDate = publishDate;
  }

  /** Create new workout given data, update db, return new workout data
   *    
   * Data may include:
   *   { swId, name, description, category, scoreType, publishDate }
   * data must include at least one property
   *
   * Returns { id, swId, name, description, category, scoreType, createDate, publishDate }
   **/
  static async create(data) {
    const jstoSql = {
      swId: "sw_id",
      name: "wo_name",
      description: "wo_description",
      category: "category",
      scoreType: "score_type",
      publishDate: "publish_date"
    }

    let {insertClause, valuesArr} = buildInsertQuery(data, jstoSql);

    const res = await db.query(
      `INSERT INTO workouts 
        ${insertClause}
        RETURNING id,
                  sw_id AS swId, 
                  wo_name AS name,
                  wo_description AS description,
                  score_type AS "scoreType",
                  category,
                  TO_CHAR(create_date, 'YYYYMMDD') AS "createDate",
                  TO_CHAR(publish_date, 'YYYYMMDD') AS "publishDate"`,           
      [...valuesArr]
    );

    const workout = res.rows[0];
    
    return new Workout(workout);
  }

  /** Find all workouts matching optional filtering criteria
   * Filters are swId, name, description, category, movementIds, publishDate, movementId 
   *
   * Returns [ workout1, workout1, ... ]
   * where workout is { id, swId, name, description, category, scoreType, createDate, publishDate }
   * */
  static async findAll(data) {
    let dataWithoutMovementId = {...data};
    delete dataWithoutMovementId.movementId;

    const jstoSql = {
      swId: "sw_id",
      name: "wo_name",
      description: "wo_description",
      category: "category",
      scoreType: "score_type",
      publishDate: "publish_date"
    }
  
    const compOp = {
      swId: "ILIKE",
      name: "ILIKE",
      description: "ILIKE",
      category: "ILIKE",
      scoreType: "ILIKE",
      publishDate: "date"
    }

    let {whereClause, valuesArr} = buildSelectQuery(dataWithoutMovementId, jstoSql, compOp);

    //add intersect to workouts_movements table clause if movementId array supplied
    let intersectClauses = "";
    if (data.movementId && data.movementId.length) {
      for (let i=0; i < data.movementId.length; i++) {
        intersectClauses += ` INTERSECT SELECT w.id, wo_name AS name
                                FROM workouts w 
                                JOIN workouts_movements wm ON w.id = wm.wo_id 
                                JOIN movements m ON m.id = wm.movement_id 
                                WHERE m.id = $${valuesArr.length + i + 1}`;
        valuesArr.push(data.movementId[i]);
      }  
    }

    let res = await db.query(
      `SELECT id,
              wo_name AS name
        FROM workouts
        ${whereClause}
        ${intersectClauses}
        ORDER BY name`,
        [...valuesArr]
    );

    return res.rows.map(ele => new Workout(ele));
  }
    

  /** Given a workout id, return details about workout.
   *
   * Returns { id, swId, name, description, category, scoreType, createDate, modifyDate, publishDate }
   *
   * Throws NotFoundError if not found.
   **/
  static async find(id) {
    const res = await db.query(
      `SELECT id, 
              sw_id AS "swId", 
              wo_name AS name, 
              wo_description AS description, 
              category,
              score_type AS "scoreType", 
              TO_CHAR(create_date, 'YYYYMMDD') AS "createDate",
              TO_CHAR(modify_date, 'YYYYMMDD') AS "modifyDate",
              TO_CHAR(publish_date, 'YYYYMMDD') AS "publishDate"
       FROM workouts
       WHERE id = $1`,
      [id]
    );

    const workout = res.rows[0];

    if (!workout) throw new NotFoundError(`No workout: ${id}`);

    return new Workout(workout);
  }

  /** Update workout data 
   *
   * Data can include:
   *   { swId, name, description, category, scoreType, date }
   *
   * Returns { id, swId, name, description, category, score_type, date }
   *
   * Throws NotFoundError if not found.
   **/
  async update(data) {
    const jstoSql = {
      swId: "sw_id",
      name: "wo_name",
      description: "wo_description",
      category: "category",
      scoreType: "score_type",
      publishDate: "publish_date"
    }
    let {setClause, valuesArr} = buildUpdateQuery(data, jstoSql);
    setClause += `, modify_date=CURRENT_TIMESTAMP `;

    const res = await db.query(
      `UPDATE workouts 
        ${setClause}
        WHERE id = $${valuesArr.length + 1}
        RETURNING id, 
                  sw_id AS "swId", 
                  wo_name AS name, 
                  wo_description AS description, 
                  category,
                  score_type AS "scoreType", 
                  TO_CHAR(create_date, 'YYYYMMDD') AS "createDate",
                  TO_CHAR(modify_date, 'YYYYMMDD') AS "modifyDate",
                  TO_CHAR(publish_date, 'YYYYMMDD') AS "publishDate"`,              
      [...valuesArr, this.id]
    );

    const workout = res.rows[0];

    if (!workout) throw new NotFoundError(`No workout: ${this.id}`);

    return new Workout(workout);
  }


  /** Delete workout 
   * 
   * Returns undefined
   **/
  async remove() {
    let res = await db.query(
      `DELETE
        FROM workouts
        WHERE id = $1
        RETURNING id`,
      [this.id],
    );
    const workout = res.rows[0];

    if (!workout) throw new NotFoundError(`No workout: ${this.id}`);
  }

}

module.exports = Workout;

