/** Workout in Fitfam. */

const axios = require("axios");

const db = require("../db");
const { NotFoundError } = require("../expressError");

const { buildWorkoutQuery } = require("../utils/sql");

const API_KEY = require("../secret");
const SUGARWOD_BASE_URL = "https://api.sugarwod.com/v2";

/** Workout in the database. */

class Workout {
  constructor({ id, swId, name, description, scoreType, category, date }) {
    this.id = id;
    this.swId = swId;
    this.name = name;
    this.description = description;
    this.scoreType = scoreType;
    this.category = category;
    this.date = date;
  }

  /** Create new workout
   *
   * Returns { id, swId, name, description, category, score_type, date }
   **/
  static async create({ swId, name, description, category, scoreType, date }) {
    const res = await db.query(
      `INSERT INTO workouts
        (sw_id, wo_name, wo_description, category, score_type, wo_date)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id,
                  sw_id AS swId, 
                  wo_name AS name,
                  wo_description AS description,
                  score_type AS "scoreType",
                  category,
                  TO_CHAR(wo_date, 'YYYYMMDD') AS date`,
      [swId, name, description, category, scoreType, date]
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
            `INSERT INTO workouts (sw_id, wo_name, wo_description, category, score_type, wo_date)
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
   * Returns { id, swId, name, description, category, score_type, date }
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
              TO_CHAR(wo_date, 'YYYYMMDD') AS date
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
   async update({ swId, name, description, category, scoreType, date }) {
    let newSwId = swId ? swId : this.swId;
    let newName = name ? name : this.name;
    let newDescription = description ? description : this.description;
    let newCategory = category ? category : this.category;
    let newScoreType = scoreType ? scoreType : this.scoreType;
    let newDate = date ? date : this.date;

    const res = await db.query(
      `UPDATE workouts 
       SET sw_id=$1,
           wo_name=$2, 
           wo_description=$3, 
           category=$4, 
           score_type=$5,
           wo_date=$6
       WHERE id = $7
       RETURNING id,
                  sw_id AS swId, 
                  wo_name AS name,
                  wo_description AS description,
                  score_type AS "scoreType",
                  category,
                  TO_CHAR(wo_date, 'YYYYMMDD') AS date`,        
      [newSwId, newName, newDescription, newCategory, newScoreType, newDate, this.id]
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

