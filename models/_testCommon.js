const db = require("../db.js");

const testFamilyIds = [];
const testWorkoutIds = [];
const testResultIds = [];
const testCommentIds = [];

async function commonBeforeAll() {
  await db.query("DELETE FROM users");
  await db.query("DELETE FROM families");
  await db.query("DELETE FROM results");
  await db.query("DELETE FROM comments");

  await db.query(
    `INSERT INTO users (username, email, user_password, first_name, last_name, image_url, bio)
      VALUES ('u1', 'u1@mail.com', 'password1', 'First1', 'Last1', null, null),
             ('u2', 'u2@mail.com', 'password2', 'First2', 'Last2', 'user2image.com', null),
             ('u3', 'u3@mail.com', 'password3', 'First3', 'Last3', 'user3image.com', 'Bio of u3')`
  );

  const familyResults = await db.query(
    `INSERT INTO families (familyname)
      VALUES ('fam1'),
            ('fam2')
      RETURNING id`
  );

  testFamilyIds.push(...familyResults.rows.map(ele => ele.id));

  await db.query(
    `INSERT INTO users_families (username, family_id)
      VALUES ('u1', $1)`,
    [testFamilyIds[0]]
  );

  const workoutResults = await db.query(
    `INSERT INTO workouts (wo_name, wo_description)
      VALUES ('Wo1', 'Description of workout1'),
             ('Wo2', 'Description of workout2')
      RETURNING id`
  );

  testWorkoutIds.push(...workoutResults.rows.map(ele => ele.id));

  const resultResults = await db.query(
    `INSERT INTO results (username, family_id, workout_id, score)
      VALUES ('u1', $1, $2, 100),
             ('u2', $1, $2, 101),
             ('u1', $3, $2, 100),
             ('u1', $3, $4, 50)
      RETURNING id`,
    [testFamilyIds[0], testWorkoutIds[0], testFamilyIds[1], testWorkoutIds[1]]
  );

  testResultIds.push(...resultResults.rows.map(ele => ele.id));

  const commentResults = await db.query(
    `INSERT INTO comments (result_id, username, content)
      VALUES ($1, 'u2', 'Comment content1'),
             ($2, 'u1', 'Comment content2')
      RETURNING id`,
    [testResultIds[0], testResultIds[1]]
  );

  testCommentIds.push(...commentResults.rows.map(ele => ele.id));
}

async function commonBeforeEach() {
  await db.query("BEGIN");
}

async function commonAfterEach() {
  await db.query("ROLLBACK");
}

async function commonAfterAll() {
  await db.end();
}


module.exports = {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  testFamilyIds,
  testWorkoutIds,
  testResultIds,
  testCommentIds
};