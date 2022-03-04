const db = require("../db.js");

const testUserIds = [];
const testFamilyIds = [];
const testWorkoutIds = [];
const testResultIds = [];
const testCommentIds = [];

async function commonBeforeAll() {
  await db.query("DELETE FROM users");
  await db.query("DELETE FROM families");
  await db.query("DELETE FROM results");
  await db.query("DELETE FROM comments");

  const user1 = await db.query(
    `INSERT INTO users (email, user_password, first_name, last_name)
      VALUES ('u1@mail.com', 'password1', 'First1', 'Last1')
      RETURNING id`
  );
  const user2 = await db.query(
    `INSERT INTO users (email, user_password, first_name, last_name, image_url)
      VALUES ('u2@mail.com', 'password2', 'First2', 'Last2', 'user2image.com')
      RETURNING id`
  );
  const user3 = await db.query(
    `INSERT INTO users (email, user_password, first_name, last_name, image_url, bio)
      VALUES ('u3@mail.com', 'password3', 'First3', 'Last3', 'user3image.com', 'Bio of u3')
      RETURNING id`
  );
  testUserIds.push(user1.rows[0].id);
  testUserIds.push(user2.rows[0].id);
  testUserIds.push(user3.rows[0].id);

  const familyResults = await db.query(
    `INSERT INTO families (family_name)
      VALUES ('fam1'),
            ('fam2')
      RETURNING id`
  );

  testFamilyIds.push(...familyResults.rows.map(ele => ele.id));

  await db.query(
    `INSERT INTO users_families (user_id, family_id)
      VALUES ($1, $2)`,
    [testUserIds[0], testFamilyIds[0]]
  );

  const workoutResults = await db.query(
    `INSERT INTO workouts (wo_name, wo_description)
      VALUES ('Wo1', 'Description of workout1'),
             ('Wo2', 'Description of workout2')
      RETURNING id`
  );

  testWorkoutIds.push(...workoutResults.rows.map(ele => ele.id));

  const resultResults = await db.query(
    `INSERT INTO results (user_id, family_id, workout_id, score)
      VALUES ($5, $1, $2, 100),
             ($6, $1, $2, 101),
             ($5, $3, $2, 100),
             ($5, $3, $4, 50)
      RETURNING id`,
    [testFamilyIds[0], testWorkoutIds[0], testFamilyIds[1], testWorkoutIds[1], testUserIds[0], testUserIds[1]]
  );

  testResultIds.push(...resultResults.rows.map(ele => ele.id));

  const commentResults = await db.query(
    `INSERT INTO comments (result_id, user_id, content)
      VALUES ($1, $3, 'Comment content1'),
             ($2, $3, 'Comment content2')
      RETURNING id`,
    [testResultIds[0], testResultIds[1], testUserIds[0]]
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
  testUserIds,
  testFamilyIds,
  testWorkoutIds,
  testResultIds,
  testCommentIds
};