"use strict";

const db = require("../db.js");
const User = require("../models/user");
const Family = require("../models/family");
const Workout = require("../models/workout");
const Result = require("../models/result");
const Comment = require("../models/comment");

const testFamilyIds = [];
const testWorkoutIds = [];
const testResultIds = [];
const testCommentIds = [];

async function commonBeforeAll() {
  await db.query("DELETE FROM users");
  await db.query("DELETE FROM families");
  await db.query("DELETE FROM results");
  await db.query("DELETE FROM comments");

  await User.create(
    {
      username: "u1",
      email: "u1@mail.com",
      password: "password1",
      firstName: "First1",
      lastName: "Last1",
    }
  );
  await User.create(
    {
      username: "u2",
      email: "u2@mail.com",
      password: "password2",
      firstName: "First2",
      lastName: "Last2",
      imageUrl: "user2image.com",
    }
  );
  await User.create(
    {
      username: "u3",
      email: "u3@mail.com",
      password: "password3",
      firstName: "First3",
      lastName: "Last3",
      imageUrl: "user3image.com",
      bio: "Bio of u3"
    }
  );

  const family1 = await Family.create(
    {familyname: "fam1"}
  );
  const family2 = await Family.create(
    {familyname: "fam2"}
  );
  testFamilyIds.push(family1.id);
  testFamilyIds.push(family2.id);

  const workout1 = await Workout.create(
    {
      name: "Wo1",
      description: "Description of workout 1"
    }
  );
  const workout2 = await Workout.create(
    {
      name: "Wo2",
      description: "Description of workout 2"
    }
  );
  testWorkoutIds.push(workout1.id);
  testWorkoutIds.push(workout2.id);

  const result1 = await Result.create(
    {
      username: "u1",
      familyId: testFamilyIds[0],
      workoutId: testWorkoutIds[0],
      score: 100
    }
  );
  const result2 = await Result.create(
    {
      username: "u2",
      familyId: testFamilyIds[0],
      workoutId: testWorkoutIds[0],
      score: 101
    }
  );
  const result3 = await Result.create(
    {
      username: "u1",
      familyId: testFamilyIds[1],
      workoutId: testWorkoutIds[0],
      score: 101
    }
  );
  const result4 = await Result.create(
    {
      username: "u1",
      familyId: testFamilyIds[1],
      workoutId: testWorkoutIds[1],
      score: 50
    }
  );
  testResultIds.push(result1.id);
  testResultIds.push(result2.id);
  testResultIds.push(result3.id);
  testResultIds.push(result4.id);

  const comment1 = await Comment.create(
    {
      resultId: testResultIds[0],
      username: "u1",
      content: "Comment content 1"
    }
  );
  const comment2 = await Comment.create(
    {
      resultId: testResultIds[1],
      username: "u2",
      content: "Comment content 2"
    }
  );
  testCommentIds.push(comment1.id);
  testCommentIds.push(comment2.id);
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
