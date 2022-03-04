/** Workout in Fitfam. */

const axios = require("axios");

const db = require("../db");
const { NotFoundError } = require("../expressError");

const { buildWorkoutQuery, buildUpdateQuery } = require("../utils/sql");

const API_KEY = require("../secret");
const SUGARWOD_BASE_URL = "https://api.sugarwod.com/v2";

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

  /** Create new workout
   *    
   * Data may include:
   *   { swId, name, description, category, scoreType, publishDate }
   * data must include at least one property
   *
   * Returns { id, swId, name, description, category, scoreType, createDate, publishDate }
   **/
  static async create({ swId, name, description, category, scoreType, publishDate }) {
    const res = await db.query(
      `INSERT INTO workouts
        (sw_id, wo_name, wo_description, category, score_type, publish_date)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id,
                  sw_id AS swId, 
                  wo_name AS name,
                  wo_description AS description,
                  score_type AS "scoreType",
                  category,
                  TO_CHAR(create_date, 'YYYYMMDD') AS "createDate",
                  TO_CHAR(publish_date, 'YYYYMMDD') AS "publishDate"`,
      [swId, name, description, category, scoreType, publishDate]
    );

    const workout = res.rows[0];
    
    return new Workout(workout);
  }

  /** Find all workouts matching filtering criteria
   * Filters are date OR category and/or movementIds
   * 
   * Returns [ {id1, name1}, {id2, name2}, ... } ]
   **/
  static async findAll(date, category, movementIds) {
    let workoutList = [];

    //Return all workouts in database if no filtering criteria are given
    if (!date && !category && !movementIds.length) {
      const {query} = buildWorkoutQuery();
      const res = await db.query(query);
      workoutList = res.rows;
    }

    //If a date is given, filter by date only
    if (date) {
      const {query, data} = buildWorkoutQuery(date);
      const res = await db.query(query, data);
      if (res.rows.length) {
        workoutList = res.rows;
  
      //If no workout for the date is stored in the database, call the SugarWOD API
      } else {
        let resp = await axios.get(`${SUGARWOD_BASE_URL}/workouts`, 
          {params: {dates: date}, headers: {Authorization: API_KEY}}
        );
        //Store the workouts returned from the API in the database 
        for (let wo of resp.data.data) {
          const res = await db.query(
            `INSERT INTO workouts (sw_id, wo_name, wo_description, category, score_type, publish_date)
              VALUES ($1, $2, $3, $4, $5, $6)
              RETURNING id, wo_name AS name`,
            [wo.id, wo.attributes.title, wo.attributes.description, "wod", wo.attributes.score_type, wo.attributes.scheduled_date_int]
          );
          workoutList.push(res.rows[0]);
        }
      }  

    //If no date is given, filter by category and/or movementIds
    } else {
      const {query, data} = buildWorkoutQuery(null, category, movementIds);
      const res = await db.query(query, data);
      workoutList = res.rows;
    }

    return workoutList;
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

