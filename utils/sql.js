const { BadRequestError } = require("../expressError");

//Helper function to build a database query filtering workouts by date OR category and movementIds
function buildWorkoutQuery(date, category, movementIds=[]) {
  let query = ``;
  let data = [];

  if (!date && !category && !movementIds.length) {
    query = `SELECT id, 
                    wo_name AS name 
             FROM workouts
             ORDER BY name`
    return {query, data};
  }

  if (date || !movementIds.length) {
    let param = date ? "wo_date" : "category";
    data = date ? [date] : [category];

    query = `SELECT id, 
                    wo_name AS name 
             FROM workouts
             WHERE ${param} = $1
             ORDER BY name`
    return {query, data};

  } else {
    data = category ? [category, ...movementIds] : movementIds;
    let count = category ? 2 : 1;

    for (let id of movementIds) {
      if ((!category && count > 1) || (category && count > 2)) {
        query += ` INTERSECT `;
      }
      query += `SELECT w.id, 
                       wo_name AS name
                FROM workouts w 
                JOIN workouts_movements wm ON w.id = wm.wo_id 
                JOIN movements m ON m.id = wm.movement_id 
                WHERE m.id = $${count}`;
      if (category) query += ` AND w.category = $1`;
      count++;
    }
  
    query += ` ORDER BY name`;
    return {query, data};
  }
}


//Helper function to build a database query filtering results by workoutId and/or username/familyId
function buildResultQuery(workoutId, username, familyId) {
  let data = [];
  let whereCond = '';
  let count = 1;
  if (workoutId) {
    whereCond += ` WHERE workout_id=$${count}`;
    count++;
    data.push(workoutId);
  }
  if (username) {
    whereCond = count === 1 ? whereCond + ` WHERE username=$${count}` : whereCond + ` AND username=$${count}`;
    count++;
    data.push(username);
  }
  if (familyId) {
    whereCond = count === 1 ? whereCond + ` WHERE family_id=$${count}` : whereCond + ` AND family_id=$${count}`;
    count++;
    data.push(familyId);
  }

  let query = `SELECT id,
                    username, 
                    family_id AS "familyId",
                    workout_id AS "workoutId", 
                    score, 
                    notes,
                    TO_CHAR(date_completed, 'YYYYMMDD') AS "dateCompleted"
        FROM results
        ${whereCond}`;

  return {query, data};
}

/** { data, jsToSql } => { setClause, valuesArr }
 * Helper function to build the SET clause and values array for an UPDATE
 *
 * data is {field1: newVal1, field2: newVal1, ...}
 * jsToSql is {jsName1: sql_name1, jsName2: sql_name2, ...}
 * 
 * set clause is `SET field1=$1, field2=$2, ...`
 * valuesArr is [newVal1, newVal2, ...]
 **/
function buildUpdateQuery(data, jsToSql) {
  const fields = Object.keys(data);
  if (fields.length === 0) throw new BadRequestError("No data");

  let setClause = "SET";

  for (let i=0; i < fields.length; i++) {
    let sqlName = jsToSql[fields[i]];
    setClause += ` ${sqlName}=$${i+1},`;
  }
  setClause = setClause.slice(0, -1);

  return {setClause, valuesArr: Object.values(data)}
}
  




module.exports = { buildWorkoutQuery, buildResultQuery, buildUpdateQuery };

