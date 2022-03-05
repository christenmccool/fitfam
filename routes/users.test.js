"use strict";

const request = require("supertest");
const moment = require("moment");

const app = require("../app");

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  testUserIds,
  testFamilyIds
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);


/************************************** POST /users */

describe("POST /users", function () {
  test("works with required data", async function () {
    const data = {
      email: "new@mail.com",
      firstName: "First-new",
      lastName: "Last-new"
    }
    const resp = await request(app).post("/users")
        .send({
          ...data,
          password: "password-new"
        });
    expect(resp.statusCode).toEqual(201);
    expect(resp.body).toEqual({
      user: {
        id: expect.any(Number),
        ...data,
        userStatus: "active",
        imageUrl: null,
        bio: null,
        createDate: moment().format("YYYYMMDD")
      }
    });
  });

  test("works with optional data", async function () {
    const data = {
      email: "new@mail.com",
      firstName: "First-new",
      lastName: "Last-new",
      bio: "Bio of new user"
    }

    const resp = await request(app).post("/users")
        .send({
          ...data,
          password: "password-new"
        });
    expect(resp.statusCode).toEqual(201);
    expect(resp.body).toEqual({
      user: {
        id: expect.any(Number),
        ...data,
        userStatus: "active",
        imageUrl: null,
        createDate: moment().format("YYYYMMDD")
      }
    });
  });

  test("bad request if duplicate user", async function () {
    const resp = await request(app).post("/users")
        .send({
          email: "u1@mail.com",
          firstName: "First1",
          lastName: "Last1",
          password: "password-new"
        });
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request if missing data", async function () {
    const resp = await request(app)
        .post("/users")
        .send({
          email: "new@mail.com"
        });
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request if extra data", async function () {
    const resp = await request(app)
        .post("/users")
        .send({
          email: "new@mail.com",
          password: "password-new",
          firstName: "First-new",
          lastName: "Last-new",
          extra: "extra-info"
        });
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request if invalid data - email format", async function () {
    const resp = await request(app)
        .post("/users")
        .send({
          email: "not-an-email",
          password: "password-new",
          firstName: "First-new",
          lastName: "Last-new"
        });
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request if invalid data - too short password", async function () {
    const resp = await request(app)
        .post("/users")
        .send({
          email: "new@mail.com",
          password: "new",
          firstName: "First-new",
          lastName: "Last-new"
        });
    expect(resp.statusCode).toEqual(400);
  });
});

// /************************************** GET /users */

describe("GET /users", function () {
  test("works", async function () {
    const resp = await request(app).get("/users");
    expect(resp.body).toEqual({
      users: [
        {
          id: testUserIds[0],
          email: "u1@mail.com",
          firstName: "First1",
          lastName: "Last1",
          userStatus: "active",
          bio: null
        },
        {
          id: testUserIds[1],
          email: "u2@mail.com",
          firstName: "First2",
          lastName: "Last2",
          userStatus: "active",
          bio: null
        },
        {
          id: testUserIds[2],
          email: "u3@mail.com",
          firstName: "First3",
          lastName: "Last3",
          userStatus: "active",
          bio: "Bio of u3"
        }
      ]
    });
  });

  test("works for search filter -- firstName partial match", async function () {
    const resp = await request(app).get(`/users?firstName=First`);
    expect(resp.body).toEqual({
      users: [
        {
          id: testUserIds[0],
          email: "u1@mail.com",
          firstName: "First1",
          lastName: "Last1",
          userStatus: "active",
          bio: null
        },
        {
          id: testUserIds[1],
          email: "u2@mail.com",
          firstName: "First2",
          lastName: "Last2",
          userStatus: "active",
          bio: null
        },
        {
          id: testUserIds[2],
          email: "u3@mail.com",
          firstName: "First3",
          lastName: "Last3",
          userStatus: "active",
          bio: "Bio of u3"
        }
      ]
    });
  });

  test("works for search filter -- bio key word", async function () {
    const resp = await request(app).get(`/users?bio=u3`);
    expect(resp.body).toEqual({
      users: [
        {
          id: testUserIds[2],
          email: "u3@mail.com",
          firstName: "First3",
          lastName: "Last3",
          userStatus: "active",
          bio: "Bio of u3"
        }
      ]
    });
  });

  test("works for search filter -- userStatus with match", async function () {
    const resp = await request(app).get(`/users?userStatus=active`);
    expect(resp.body).toEqual({
      users: [
        {
          id: testUserIds[0],
          email: "u1@mail.com",
          firstName: "First1",
          lastName: "Last1",
          userStatus: "active",
          bio: null
        },
        {
          id: testUserIds[1],
          email: "u2@mail.com",
          firstName: "First2",
          lastName: "Last2",
          userStatus: "active",
          bio: null
        },
        {
          id: testUserIds[2],
          email: "u3@mail.com",
          firstName: "First3",
          lastName: "Last3",
          userStatus: "active",
          bio: "Bio of u3"
        }
      ]
    });
    
  });

  test("works for search filter -- userStatus with no match", async function () {
    const resp = await request(app).get(`/users?userStatus=pending`);
    expect(resp.body).toEqual({
      users: []
    });
  });
});

/************************************** GET /users/:id */

describe("GET /users/:id", function () {
  test("works", async function () {
    const resp = await request(app).get(`/users/${testUserIds[0]}`);
    expect(resp.body).toEqual({
      user: {
        id: testUserIds[0],
        email: "u1@mail.com",
        firstName: "First1",
        lastName: "Last1",
        userStatus: "active",
        createDate: moment().format("YYYYMMDD"),
        imageUrl: null,
        bio: null,
        modifyDate: null,
        families: [
          { 
            familyId: testFamilyIds[0],
            familyName: "fam1",
            memStatus: "active",
            isAdmin: false,
            primaryFamily: false  
          },
          { 
            familyId: testFamilyIds[1],
            familyName: "fam2",
            memStatus: "active",
            isAdmin: false,
            primaryFamily: false  
          }
        ]
      }
    });
  });

  test("not found if user not found", async function () {
    const resp = await request(app).get(`/users/0`)
    expect(resp.statusCode).toEqual(404);
  });
});

/************************************** PATCH /users/:id */

describe("PATCH /users/:id", () => {
  test("works", async function () {
    const resp = await request(app)
        .patch(`/users/${testUserIds[0]}`)
        .send({
          firstName: "New",
        });
    expect(resp.body).toEqual({
      user: {
        id: testUserIds[0],
        email: "u1@mail.com",
        firstName: "New",
        lastName: "Last1",
        userStatus: "active",
        createDate: moment().format("YYYYMMDD"),
        modifyDate: moment().format("YYYYMMDD"),
        imageUrl: null,
        bio: null
      }
    });
  });

  test("not found if no such user", async function () {
    const resp = await request(app)
        .patch(`/users/0`)
        .send({
          firstName: "New",
        });
    expect(resp.statusCode).toEqual(404);
  });

  test("bad request if no data", async function () {
    const resp = await request(app)
        .patch(`/users/${testUserIds[0]}`)
        .send({});
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request if extra data", async function () {
    const resp = await request(app)
        .patch(`/users/${testUserIds[0]}`)
        .send({
          email: "new@mail.com",
          extra: "extra-info"
        });
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request if invalid data - email format", async function () {
    const resp = await request(app)
        .patch(`/users/${testUserIds[0]}`)
        .send({
          email: "not-an-email"
        });
    expect(resp.statusCode).toEqual(400);
  });
});

/************************************** DELETE /users/:id */

describe("DELETE /users/:username", function () {
  test("works", async function () {
    const resp = await request(app).delete(`/users/${testUserIds[0]}`);
    expect(resp.body).toEqual({ deleted: testUserIds[0].toString() });
  });

  test("not found if user missing", async function () {
    const resp = await request(app).delete(`/users/0`);
    expect(resp.statusCode).toEqual(404);
  });
});

