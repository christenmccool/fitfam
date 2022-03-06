const { BadRequestError } = require("../expressError");


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
 * 
 * if the comparison operator is "ILIKE", allow a partial match of value by prepending and appending % to the value
 * if the comparison operator is "date", convert the value to a date with "::date ="
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

    if (op === "ILIKE") {
      whereClause += ` ${sqlName} ILIKE $${i+1} AND`;
      valuesArr.push(`%${data[fields[i]]}%`);
    } else if (op === "date") {
      whereClause += ` ${sqlName}::date = $${i+1} AND`;
      valuesArr.push(data[fields[i]]);
    } else {
      whereClause += ` ${sqlName}${op}$${i+1} AND`;
      valuesArr.push(data[fields[i]]);
    }
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
  

module.exports = { buildSelectQuery, buildInsertQuery, buildUpdateQuery };

