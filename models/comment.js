/** Comment class */

const db = require("../db");
const { NotFoundError } = require("../expressError");

const { buildSelectQuery, buildUpdateQuery } = require("../utils/sql");

class Comment {
  constructor({ id, resultId, userId, content, createDate, modifyDate, userFirst, userLast }) {
    this.id = id;
    this.resultId = resultId;
    this.userId = userId;
    this.content = content;
    this.createDate = createDate;
    this.modifyDate = modifyDate;
    this.userFirst = userFirst;
    this.userLast = userLast;
  }

  /** Create new comment given data, update db, return new comment data
   * 
   * data must include { resultId, userId, content }
   *
   * Returns { id, resultId, userId, content, createDate, userFirst, userLast }
   **/
  // static async create({ resultId, userId, content }) {
  static async create({ resultId, userId, content }) {

    const res = await db.query(
      `WITH inserted_comment AS 
        (INSERT INTO comments 
          (result_id, user_id, content)
          VALUES ($1, $2, $3)
          RETURNING id,
                    user_id,
                    result_id, 
                    content,
                    create_date )
        SELECT inserted_comment.id, 
               inserted_comment.user_id AS "userId", 
               inserted_comment.result_id AS "resultId", 
               inserted_comment.content, 
               TO_CHAR(inserted_comment.create_date, 'YYYYMMDD') AS "createDate",
               u.first_name AS "userFirst", 
               u.last_name AS "userLast"
        FROM inserted_comment 
        JOIN users u 
          ON u.id=inserted_comment.user_id`,                
      [resultId, userId, content]
    );

    const comment = res.rows[0];

    return new Comment(comment);
  }
  

  /** Find all comments matching optional filtering criteria
   * Filters are resultId, userId, content
   *
   * Returns [ comment1, comment2, ... ]
   * where comment is { id, resultId, userId, content, createDate, modifyDate, userFirst, userLast }
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
    `SELECT c.id,
            c.result_id AS "resultId",
            c.user_id AS "userId",
            c.content, 
            TO_CHAR(c.create_date, 'YYYYMMDD') AS "createDate",
            TO_CHAR(c.modify_date, 'YYYYMMDD') AS "modifyDate",
            u.first_name as "userFirst",
            u.last_name as "userLast"
      FROM comments c
      JOIN users u
        ON u.id = c.user_id
      ${whereClause}
      ORDER BY id`,
      [...valuesArr]
  );

    
    return res.rows.map(ele => new Comment(ele));
  }
  
  /** Return data about a comment given comment id
   *
   * Returns { id, resultId, userId, content, createDate, modifyDate, userFirst, userLast }
   *
   * Throws NotFoundError if not found.
   **/
  static async find(id) {
    const res = await db.query(
      `SELECT c.id,
              c.result_id AS "resultId",
              c.user_id AS "userId",
              c.content, 
              TO_CHAR(c.create_date, 'YYYYMMDD') AS "createDate",
              TO_CHAR(c.modify_date, 'YYYYMMDD') AS "modifyDate",
              u.first_name as "userFirst",
              u.last_name as "userLast"
        FROM comments c
        JOIN users u
          ON u.id = c.user_id
        WHERE c.id = $1`,
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
   * Returns { id, resultId, userId, content, createDate, modifyDate, userFirst, userLast }
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
      `WITH updated_comment AS 
        (UPDATE comments 
          ${setClause}
          WHERE id = $${valuesArr.length + 1}
          RETURNING id,
                    user_id, 
                    result_id,
                    content,
                    create_date,
                    modify_date )
        SELECT updated_comment.id, 
               updated_comment.user_id AS "userId", 
               updated_comment.result_id AS "resultId", 
               updated_comment.content, 
               TO_CHAR(updated_comment.create_date, 'YYYYMMDD') AS "createDate",
               TO_CHAR(updated_comment.modify_date, 'YYYYMMDD') AS "modifyDate",
               u.first_name AS "userFirst", 
               u.last_name AS "userLast"
        FROM updated_comment 
        JOIN users u 
          ON u.id=updated_comment.user_id`, 
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
