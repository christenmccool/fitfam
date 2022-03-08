const db = require("../../db.js");

const bcrypt = require("bcrypt");
const { BCRYPT_WORK_FACTOR } = require("../../config");

const testUserIds = [];
const testFamilyIds = [];
const testMembershipIds = [];
const testWorkoutIds = [];
const testResultIds = [];
const testCommentIds = [];

async function commonBeforeAll() {
  await db.query("DELETE FROM users");
  await db.query("DELETE FROM families");
  await db.query("DELETE FROM users_families");
  await db.query("DELETE FROM results");
  await db.query("DELETE FROM comments");

  const hashedpassword = await bcrypt.hash("password", BCRYPT_WORK_FACTOR);

  const user1 = await db.query(
    `INSERT INTO users (email, user_password, first_name, last_name)
      VALUES ('u1@mail.com', '${hashedpassword}', 'First1', 'Last1')
      RETURNING id`
  );
  const user2 = await db.query(
    `INSERT INTO users (email, user_password, first_name, last_name, image_url)
      VALUES ('u2@mail.com', '${hashedpassword}', 'First2', 'Last2', 'user2image.com')
      RETURNING id`
  );
  const user3 = await db.query(
    `INSERT INTO users (email, user_password, first_name, last_name, is_admin, image_url, bio)
      VALUES ('u3@mail.com', '${hashedpassword}', 'First3', 'Last3', true, 'user3image.com', 'Bio of u3')
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

  const membershipResults = await db.query(
    `INSERT INTO users_families (user_id, family_id)
      VALUES ($1, $2), ($1, $3), ($4, $2)`,
    [testUserIds[0], testFamilyIds[0], testFamilyIds[1], testUserIds[1]]
  );

  testMembershipIds.push(...membershipResults.rows.map(ele => ele.id));

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
  testMembershipIds,
  testWorkoutIds,
  testResultIds,
  testCommentIds
};