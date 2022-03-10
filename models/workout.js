/** Workout class */

const db = require("../db");

const ApiCall = require("../services/apiCall");

const { NotFoundError } = require("../expressError");

const { buildInsertQuery, buildSelectQuery, buildUpdateQuery } = require("../utils/sql");


/** Workout in the database. */

class Workout {
  constructor({ id, swId, name, description, scoreType, category, createDate, modifyDate, featuredDate, createBy, movements }) {
    this.id = id;
    this.swId = swId;
    this.name = name;
    this.description = description;
    this.scoreType = scoreType;
    this.category = category;
    this.createDate = createDate;
    this.modifyDate = modifyDate;
    this.featuredDate = featuredDate;
    this.createBy = createBy;
    this.movements = movements;
  }

  /** Create new workout given data, update db, return new workout data
   *    
   * Data may include:
   *   { swId, name, description, category, scoreType, featuredDate, createBy }
   * data must include at least one property
   *
   * Returns { id, swId, name, description, category, scoreType, createDate, featuredDate, createBy }
   **/
  static async create(data) {
    const jstoSql = {
      swId: "sw_id",
      name: "wo_name",
      description: "wo_description",
      category: "category",
      scoreType: "score_type",
      featuredDate: "featured_date",
      createBy: "create_by"
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
                  TO_CHAR(featured_date, 'YYYYMMDD') AS "featuredDate",
                  create_by as "createBy"`,                    
      [...valuesArr]
    );

    const workout = res.rows[0];
    
    return new Workout(workout);
  }

  /** Find featured workouts (category "wod") for a given date
   * 
   * Returns [ workout1, workout1, ... ]
   * where workout is { id, name, description }
   * */
  //  static async findByDate(date) {
  //   // Check if the date's workouts are already in the database
  //   // If not, call the API and add the date's workouts to the database
    
  //   const res = await db.query(
  //     `SELECT id,
  //             wo_name AS name
  //       FROM workouts
  //       WHERE category = 'wod' AND publish_date=$1`,
  //       [date]
  //   );

  //   let workouts = res.rows;
  //   console.log(workouts)

  //   if (workouts.length) {
  //     return workouts.map(ele => new Workout(ele));
  //   } 

  //   let workoutsFromApi = [];
  //   const apiRes = await ApiCall.getWorkouts(date);

  //   for (let wo of apiRes) {
  //     let woData = {...wo};
  //     let movementIds = wo.movementIds;
  //     delete woData.movementIds;
  //     let newWorkout = await Workout.create(woData);
  //     workoutsFromApi.push(newWorkout);

  //     //insert workout's movements ids into the db
  //     for (let movementId of movementIds) {
  //       workouts = await db.query(
  //         `INSERT INTO workouts_movements
  //           (wo_id, movement_id)
  //           VALUES
  //           ($1, $2)`,
  //           [newWorkout.id, movementId]
  //       )
  //     }
  //   }

  //   return workoutsFromApi.map(ele => new Workout({id: ele.id, name: ele.name}));
  // }


  /** Find all workouts matching optional filtering criteria
   * Filters are swId, name, description, category, featuredDate, createBy, movementId 
   * Filter 'keyword' is name or description
   *
   * Returns [ workout1, workout1, ... ]
   * where workout is { id, name, description }
   * */
  static async findAll(data) {
    //If filter data includes featuredBy, first ensure that the API featured workout is in the database
    //If it's not, call the API and add the workout to the database
    if (data && data.featuredDate) {
      let res = await db.query(
        `SELECT id,
                wo_name AS name
          FROM workouts
          WHERE category = 'featured' AND featured_date=$1`,
          [data.featuredDate]
      );

      if (!res.rows.length) {
        let workouts = await ApiCall.getWorkouts(data.featuredDate);

        for (let wo of workouts) {
          let woData = {...wo};
          let movementIds = wo.movementIds;
          delete woData.movementIds;

          let newWorkout = await Workout.create(woData);

          for (let movementId of movementIds) {
            await db.query(
              `INSERT INTO workouts_movements
                (wo_id, movement_id)
                VALUES
                ($1, $2)`,
                [newWorkout.id, movementId]
            )
          }
        }
      }
    }

    let dataPartial = {...data};
    delete dataPartial.movementId;
    delete dataPartial.keyword;

    const jstoSql = {
      swId: "sw_id",
      name: "wo_name",
      description: "wo_description",
      category: "category",
      scoreType: "score_type",
      featuredDate: "featured_date",
      createBy: "create_by"
    }
  
    const compOp = {
      swId: "ILIKE",
      name: "ILIKE",
      description: "ILIKE",
      category: "ILIKE",
      scoreType: "ILIKE",
      featuredDate: "date",
      createBy: "="
    }

    let {whereClause, valuesArr} = buildSelectQuery(dataPartial, jstoSql, compOp);

    if (data.keyword) {
      if (!valuesArr.length) {
        whereClause = "WHERE wo_name ILIKE $1 OR wo_description ILIKE $1 "
      } else {
        whereClause += `AND (wo_name ILIKE $${valuesArr.length + 1} OR wo_description ILIKE $${valuesArr.length + 1}) `
      }
      valuesArr.push(`%${data.keyword}%`)
    }

    //add intersect to workouts_movements table clause if movementId array supplied
    let intersectClauses = "";
    if (data.movementId && data.movementId.length) {
      let startingInd = valuesArr.length + 1;
      for (let i=0; i < data.movementId.length; i++) {
        intersectClauses += ` INTERSECT SELECT w.id, wo_name AS name
                                FROM workouts w 
                                JOIN workouts_movements wm ON w.id = wm.wo_id 
                                JOIN movements m ON m.id = wm.movement_id 
                                WHERE m.id = $${startingInd + i}`;
        valuesArr.push(data.movementId[i]);
      }  
    }

    let res = await db.query(
      `SELECT w.id, 
              w.wo_name AS name,
              w.wo_description AS description
        FROM 
          (SELECT id,
                  wo_name AS name
            FROM workouts w
            ${whereClause}
            ${intersectClauses}) i
        JOIN
          workouts w
          ON w.id = i.id
          ORDER BY wo_name`,
        [...valuesArr]
    );

    return res.rows.map(ele => new Workout(ele));
  }
    

  /** Given a workout id, return details about workout.
   *
   * Returns { id, swId, name, description, category, scoreType, createDate, modifyDate, featuredDate, createBy, movements }
   *  where movements is {movementId, movementName, youtubeId}
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
              TO_CHAR(featured_date, 'YYYYMMDD') AS "featuredDate",
              create_by AS "createBy"
       FROM workouts
       WHERE id = $1`,
      [id]
    );

    const workout = res.rows[0];

    if (!workout) throw new NotFoundError(`No workout: ${id}`);

    const movementRes = await db.query(
      `SELECT wm.movement_id AS "movementId",
              m.movement_name AS "movementName",
              m.youtube_id AS "youtubeId"
        FROM workouts_movements wm
        JOIN movements m
        ON wm.movement_id=m.id
        WHERE wm.wo_id=$1`,
        [id]
    )

    let movements = movementRes.rows;

    return new Workout({...workout, movements});
  }

  /** Update workout data 
   *
   * Data can include:
   *   { swId, name, description, category, scoreType }
   *
   * Returns { id, swId, name, description, category, scoreType, createDate, modifyDate, featuredDate, createBy }
   *
   * Throws NotFoundError if not found.
   **/
  async update(data) {
    const jstoSql = {
      swId: "sw_id",
      name: "wo_name",
      description: "wo_description",
      category: "category",
      scoreType: "score_type"
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
                  TO_CHAR(featured_date, 'YYYYMMDD') AS "featuredDate"
                  create_by AS "createBy`,                         
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

