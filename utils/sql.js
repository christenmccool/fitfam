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
    let param = date ? "publish_date" : "category";
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


//Helper function to build a database query filtering results by workoutId and/or userId/familyId
function buildResultQuery(workoutId, userId, familyId) {
  let data = [];
  let whereCond = '';
  let count = 1;
  if (workoutId) {
    whereCond += ` WHERE workout_id=$${count}`;
    count++;
    data.push(workoutId);
  }
  if (userId) {
    whereCond = count === 1 ? whereCond + ` WHERE user_id=$${count}` : whereCond + ` AND user_id=$${count}`;
    count++;
    data.push(userId);
  }
  if (familyId) {
    whereCond = count === 1 ? whereCond + ` WHERE family_id=$${count}` : whereCond + ` AND family_id=$${count}`;
    count++;
    data.push(familyId);
  }

  let query = `SELECT id,
                      user_id AS "userId",
                      family_id AS "familyId",
                      workout_id AS "workoutId", 
                      score, 
                      notes,
                      TO_CHAR(create_date, 'YYYYMMDD') AS "createDate",
                      TO_CHAR(modify_date, 'YYYYMMDD') AS "modifyDate",
                      TO_CHAR(complete_date, 'YYYYMMDD') AS "completeDate"
        FROM results
        ${whereCond}`;

  return {query, data};
}


/** { data, jsToSql } => { insertClause, valuesArr }
 * Helper function to build part of an INSERT query
 * Returns part of the INSERT clause and a values array
 *
 * data is {field1: val1, field2: val2, ...}
 * jsToSql is {jsName1: sql_name1, jsName2: sql_name2, ...}
 * 
 * insertClause is `(field1, field2,...) VALUES ($1, $2,... ) `
 * valuesArr is [val1, val2, ...]
 **/
 function buildInsertQuery(data={}, jsToSql) {
  const fields = Object.keys(data);
  if (fields.length === 0) throw new BadRequestError("No data");

  let insertFields = " (";
  let valuesClause = "VALUES (";

  for (let i=0; i < fields.length; i++) {
    let sqlName = jsToSql[fields[i]];
    insertFields += `${sqlName}, `;
    valuesClause += `$${i+1}, `;
  }
  insertFields = insertFields.slice(0, -2);
  insertFields += ") ";
  valuesClause = valuesClause.slice(0, -2);
  valuesClause += ") ";

  let insertClause = insertFields + valuesClause;
  return {insertClause, valuesArr: Object.values(data)}
}


/** { data, jsToSql, compOp } => { whereClause, valuesArr }
 * Helper function to build part of a SELECT query
 * Returns the WHERE clause and a values array
 *
 * data is {field1: val1, field2: val2, ...}
 * jsToSql is {jsName1: sql_name1, jsName2: sql_name2, ...}
 * compOp is {jsName1: comparisonOperator1, jsName2: comparisonOperator2, ...}
 * if the comparison operator is "ILIKE", allow a partial match of value by prepending and appending % to the value
 * 
 * whereClause is for example ` WHERE field1=$1 AND field2 ILIKE %$2% ... `
 * valuesArr is [val1, val2, ...]
 **/
 function buildSelectQuery(data={}, jsToSql, compOp) {
  const fields = Object.keys(data);
  let valuesArr = [];

  let whereClause = fields.length === 0 ? "" : " WHERE";

  for (let i=0; i < fields.length; i++) {
    const sqlName = jsToSql[fields[i]];
    const op = compOp[fields[i]];

    whereClause += op === "ILIKE" ? ` ${sqlName} ILIKE $${i+1} AND` :` ${sqlName}${op}$${i+1} AND`;

    const val = op === "ILIKE" ? `%${data[fields[i]]}%` : data[fields[i]];
    valuesArr.push(val);
  }
  whereClause = whereClause.slice(0, -4);
  whereClause += " ";

  return {whereClause, valuesArr}
}

  
/** { data, jsToSql } => { setClause, valuesArr }
 * Helper function to build part of an UPDATE query
 * Returns the SET clause and a values array
 *
 * data is {field1: newVal1, field2: newVal2, ...}
 * jsToSql is {jsName1: sql_name1, jsName2: sql_name2, ...}
 * 
 * set clause is `SET field1=$1, field2=$2, ...`
 * valuesArr is [newVal1, newVal2, ...]
 **/
function buildUpdateQuery(data={}, jsToSql) {
  const fields = Object.keys(data);
  if (fields.length === 0) throw new BadRequestError("No data");

  let setClause = " SET";

  for (let i=0; i < fields.length; i++) {
    let sqlName = jsToSql[fields[i]];
    setClause += ` ${sqlName}=$${i+1},`;
  }
  setClause = setClause.slice(0, -1);
  setClause += " ";

  return {setClause, valuesArr: Object.values(data)}
}
  




module.exports = { buildWorkoutQuery, buildResultQuery, buildSelectQuery, buildInsertQuery, buildUpdateQuery };

