"use strict";

const request = require("supertest");
const moment = require("moment");

const app = require("../app");

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  testFamilyIds
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);


/************************************** POST /users */

describe("POST /users", function () {
  test("works", async function () {
    const resp = await request(app).post("/users")
        .send({
          username: "u-new",
          email: "new@mail.com",
          password: "password-new",
          firstName: "First-new",
          lastName: "Last-new",
        });
    expect(resp.statusCode).toEqual(201);
    expect(resp.body).toEqual({
      user: {
        username: "u-new",
        email: "new@mail.com",
        firstName: "First-new",
        lastName: "Last-new",
        imageUrl: null,
        bio: null,
        joinDate: moment().format("YYYYMMDD")
      }
    });
  });

  test("bad request if duplicate user", async function () {
    const resp = await request(app)
        .post("/users")
        .send({
          username: "u1",
          email: "u1@mail.com",
          password: "password1",
          firstName: "First1",
          lastName: "Last1",
        });
    expect(resp.statusCode).toEqual(400);
  });
});

/************************************** GET /users */

describe("GET /users", function () {
  test("works", async function () {
    const resp = await request(app).get("/users");
    expect(resp.body).toEqual({
      users: [
        {
          username: "u1",
          email: "u1@mail.com",
          firstName: "First1",
          lastName: "Last1",
          imageUrl: null,
          bio: null,
          joinDate: moment().format("YYYYMMDD")
        },
        {
          username: "u2",
          email: "u2@mail.com",
          firstName: "First2",
          lastName: "Last2",
          imageUrl: "user2image.com",
          bio: null,
          joinDate: moment().format("YYYYMMDD")
        },
        {
          username: "u3",
          email: "u3@mail.com",
          firstName: "First3",
          lastName: "Last3",
          imageUrl: "user3image.com",
          bio: "Bio of u3",
          joinDate: moment().format("YYYYMMDD")
        }
      ]
    });
  });
});

/************************************** GET /users/:username */

describe("GET /users/:username", function () {
  test("works", async function () {
    const resp = await request(app).get(`/users/u1`);
    expect(resp.body).toEqual({
      user: {
        username: "u1",
        email: "u1@mail.com",
        firstName: "First1",
        lastName: "Last1",
        imageUrl: null,
        bio: null,
        joinDate: moment().format("YYYYMMDD"),
        families: [{ familyId: testFamilyIds[0], familyname: "fam1" }]
      }
    });
  });

  test("not found if user not found", async function () {
    const resp = await request(app).get(`/users/fake`)
    expect(resp.statusCode).toEqual(404);
  });
});

/************************************** PATCH /users/:username */

describe("PATCH /users/:username", () => {
  test("works", async function () {
    const resp = await request(app)
        .patch(`/users/u1`)
        .send({
          firstName: "New",
        });
    expect(resp.body).toEqual({
      user: {
        username: "u1",
        email: "u1@mail.com",
        firstName: "New",
        lastName: "Last1",
        imageUrl: null,
        bio: null,
        joinDate: moment().format("YYYYMMDD")
      }
    });
  });

  test("not found if no such user", async function () {
    const resp = await request(app)
        .patch(`/users/fake`)
        .send({
          firstName: "New",
        });
    expect(resp.statusCode).toEqual(404);
  });
});

/************************************** DELETE /users/:username */

describe("DELETE /users/:username", function () {
  test("works", async function () {
    const resp = await request(app).delete(`/users/u1`);
    expect(resp.body).toEqual({ deleted: "u1" });
  });

  test("not found if user missing", async function () {
    const resp = await request(app).delete(`/users/nope`);
    expect(resp.statusCode).toEqual(404);
  });
});

/************************************** POST /users/:username/families/:familyId */

describe("POST /users/:username/families/:familyId", function () {
  test("works", async function () {
    const resp = await request(app)
        .post(`/users/u2/families/${testFamilyIds[0]}`);
    expect(resp.body).toEqual({ joined: testFamilyIds[0] });
  });

  test("not found for no such familyId", async function () {
    const resp = await request(app)
        .post(`/users/us/families/0`);
    expect(resp.statusCode).toEqual(404);
  });
});

/************************************** Get /users/:username/families */

describe("GET /users/:username/families", function () {
  test("works", async function () {
    const resp = await request(app).get(`/users/u1/families`);
    expect(resp.body).toEqual({
      families: [
       { familyId: testFamilyIds[0], familyname: "fam1" }
      ]
    });
  });
});