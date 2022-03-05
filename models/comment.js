/** Comment class */

const db = require("../db");
const { NotFoundError } = require("../expressError");

const { buildSelectQuery, buildUpdateQuery } = require("../utils/sql");

class Comment {
  constructor({ id, resultId, userId, content, createDate, modifyDate }) {
    this.id = id;
    this.resultId = resultId;
    this.userId = userId;
    this.content = content;
    this.createDate = createDate;
    this.modifyDate = modifyDate;
  }

  /** Create new comment given data, update db, return new comment data
   * 
   * data must include { resultId, userId, content }
   *
   * Returns { id, resultId, userId, content, createDate }
   **/
  // static async create({ resultId, userId, content }) {
  static async create({ resultId, userId, content }) {
    const res = await db.query(
      `INSERT INTO comments 
        (result_id, user_id, content)
        VALUES ($1, $2, $3)
        RETURNING id,
                  result_id AS "resultId",
                  user_id AS "userId",
                  content,
                  TO_CHAR(create_date, 'YYYYMMDD') AS "createDate"`,
      [resultId, userId, content]
    );

    const comment = res.rows[0];

    return new Comment(comment);
  }
  

  /** Find all comments matching optional filtering criteria
   * Filters are resultId, userId, content
   *
   * Returns [ comment1, comment2, ... ]
   * where result is { id, resultId, userId, content, createDate, modifyDate }
   * */
   static async findAll(data) {
    const jstoSql = {
      resultId: "result_id",
      userId: "user_id",
      content: "content"
    }

  const compOp = {
    resultId: "=",
    userId: "=",
    content: "ILIKE"
  }

  let {whereClause, valuesArr} = buildSelectQuery(data, jstoSql, compOp);

  let res = await db.query(
    `SELECT id, 
            result_id AS "resultId", 
            user_id AS "userId",
            content, 
            TO_CHAR(create_date, 'YYYYMMDD') AS "createDate",
            TO_CHAR(modify_date, 'YYYYMMDD') AS "modifyDate"
      FROM comments
      ${whereClause}
      ORDER BY id`,
      [...valuesArr]
  );
    
    return res.rows.map(ele => new Comment(ele));
  }
  
  /** Return data about a comment given comment id
   *
   * Returns { id, resultId, userId, content, createDate, modifyDate }
   *
   * Throws NotFoundError if not found.
   **/
  static async find(id) {
    const res = await db.query(
      `SELECT id,
              result_id AS "resultId", 
              user_id AS "userId",
              content, 
              TO_CHAR(create_date, 'YYYYMMDD') AS "createDate",
              TO_CHAR(modify_date, 'YYYYMMDD') AS "modifyDate"
        FROM comments
        WHERE id = $1`,
        [id]
    );
  
    const comment = res.rows[0];
    if (!comment) throw new NotFoundError(`No comment: ${id}`);

    return new Comment(comment);  
  }

  /** Update comment data 
   *
   * Data must include: { content }
   *
   * Returns { id, resultId, userId, content, createDate, modifyDate }
   *
   * Throws NotFoundError if not found.
   */
  async update(data) {
    const jstoSql = {
      content: "content"
    }
    let {setClause, valuesArr} = buildUpdateQuery(data, jstoSql);
    setClause += `, modify_date=CURRENT_TIMESTAMP `;

    const res = await db.query(
      `UPDATE comments 
        ${setClause}
        WHERE id = $${valuesArr.length + 1}
        RETURNING id,
                  result_id AS "resultId", 
                  user_id AS "userId",
                  content, 
                  TO_CHAR(create_date, 'YYYYMMDD') AS "createDate",
                  TO_CHAR(modify_date, 'YYYYMMDD') AS "modifyDate"`,              
      [...valuesArr, this.id]
    );

    const comment = res.rows[0];

    if (!comment) throw new NotFoundError(`No comment: ${this.id}`);

    return new Comment(comment);
  }
  
  /** Delete result 
   * 
   * Returns undefined
   **/
  async remove() {
    let res = await db.query(
      `DELETE
       FROM comments
       WHERE id = $1
       RETURNING id`,
      [this.id],
    );
    const comment = res.rows[0];

    if (!comment) throw new NotFoundError(`No comment: ${this.id}`);
  }
}

module.exports = Comment;
