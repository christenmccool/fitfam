/** Comment class. */

const db = require("../db");
const { NotFoundError } = require("../expressError");

class Comment {
  constructor({ id, resultId, username, content, date }) {
    this.id = id;
    this.resultId = resultId;
    this.username = username;
    this.content = content;
    this.date = date;
  }

  /** Create new comment
   * data must include { resultId, username, content }
   *
   * Returns { id, resultId, username, content, date }
   **/
  static async create({ resultId, username, content }) {
    const res = await db.query(
      `INSERT INTO comments 
        (result_id, username, content)
        VALUES ($1, $2, $3)
        RETURNING id,
                  result_id AS "resultId",
                  username, 
                  content,
                  TO_CHAR(comment_date, 'YYYYMMDD') AS "date"`,
      [resultId, username, content]
    );

    const comment = res.rows[0];

    return new Comment(comment);
  }
  
  /** Find all comments 
   *
   * Returns [{ id, resultId, username, content, date }, ...]
   * */
   static async findAll() {
    const res = await db.query(
      `SELECT id, 
              result_id AS "resultId", 
              username, 
              content, 
              TO_CHAR(comment_date, 'YYYYMMDD') AS "date"
       FROM comments`
    );
    
    return res.rows.map(ele => new Comment(ele));
  }
  
  /** Return data about a comment given comment id
   *
   * Returns { id, resultId, username, content, date }
   *
   * Throws NotFoundError if not found.
   **/
  static async find(id) {
    const res = await db.query(
      `SELECT id,
              result_id AS "resultId", 
              username, 
              content, 
              TO_CHAR(comment_date, 'YYYYMMDD') AS "date"
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
   * Returns { id, resultId, username, content, date }
   *
   * Throws NotFoundError if not found.
   */
  async update({ content }) {
    let newContent = content ? content : this.content;

    const res = await db.query(
      `UPDATE comments 
        SET content=$1
        WHERE id = $2
        RETURNING id,
                  result_id AS "resultId", 
                  username, 
                  content, 
                  TO_CHAR(comment_date, 'YYYYMMDD') AS "date"`,       
      [newContent, this.id]
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
