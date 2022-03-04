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
    const resp = await request(app).post("/users")
        .send({
          email: "new@mail.com",
          password: "password-new",
          firstName: "First-new",
          lastName: "Last-new"
        });
    expect(resp.statusCode).toEqual(201);
    expect(resp.body).toEqual({
      user: {
        id: expect.any(Number),
        email: "new@mail.com",
        firstName: "First-new",
        lastName: "Last-new",
        userStatus: "active",
        createDate: moment().format("YYYYMMDD"),
        imageUrl: null,
        bio: null,
        modifyDate: null,
        families: []
      }
    });
  });

  test("works with optional data", async function () {
    const resp = await request(app).post("/users")
        .send({
          email: "new@mail.com",
          password: "password-new",
          firstName: "First-new",
          lastName: "Last-new",
          bio: "Bio of new user"
        });
    expect(resp.statusCode).toEqual(201);
    expect(resp.body).toEqual({
      user: {
        id: expect.any(Number),
        email: "new@mail.com",
        firstName: "First-new",
        lastName: "Last-new",
        userStatus: "active",
        createDate: moment().format("YYYYMMDD"),
        bio:  "Bio of new user",
        imageUrl: null,
        modifyDate: null,
        families: []
      }
    });
  });

  test("bad request if duplicate user", async function () {
    const resp = await request(app)
        .post("/users")
        .send({
          email: "u1@mail.com",
          password: "password1",
          firstName: "First1",
          lastName: "Last1"
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
});

// /************************************** GET /users/:id */

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

// /************************************** PATCH /users/:id */

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
        bio: null,
        families: [
          { 
            familyId: testFamilyIds[0],
            familyName: "fam1",
            memStatus: "active",
            isAdmin: false,
            primaryFamily: false 
          }
        ]
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

// /************************************** DELETE /users/:id */

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

// /************************************** POST /users/:id/families/:familyId */

// describe("POST /users/:id/families/:familyId", function () {
//   test("works", async function () {
//     const resp = await request(app)
//         .post(`/users/${testUserIds[1]}/families/${testFamilyIds[0]}`);
//     expect(resp.body).toEqual({
//       familyStatus: 
//         { 
//           familyId: testFamilyIds[0], 
//           status: "active",
//           isAdmin: false,
//           primaryFamily: false,
//           createDate: moment().format("YYYYMMDD")
//         }
//     });
//   });

//   test("not found for no such familyId", async function () {
//     const resp = await request(app)
//         .post(`/users/${testUserIds[1]}/families/0`);
//     expect(resp.statusCode).toEqual(404);
//   });

//   test("bad request if already a member of family", async function () {
//     const resp = await request(app)
//         .post(`/users/${testUserIds[0]}/families/${testFamilyIds[0]}`);
//     expect(resp.statusCode).toEqual(400);
//   });
// });

// // /************************************** Get /users/:id/families */

// describe("GET /users/:id/families", function () {
//   test("works", async function () {
//     const resp = await request(app).get(`/users/${testUserIds[0]}/families`);
//     expect(resp.body).toEqual({
//       families: [
//        { 
//          familyId: testFamilyIds[0], 
//          familyName: "fam1",
//          status: "active",
//          isAdmin: false,
//          primaryFamily: false,
//          createDate: moment().format("YYYYMMDD"),
//          modifyDate: null
//         }
//       ]
//     });
//   });
// });

// // /************************************** Get /users/:id/families/:familyId */

// describe("GET /users/:id/families/:familyId", function () {
//   test("works", async function () {
//     const resp = await request(app).get(`/users/${testUserIds[0]}/families/${testFamilyIds[0]}`);
//     expect(resp.body).toEqual({
//       familyStatus: { 
//         familyId: testFamilyIds[0], 
//         status: "active",
//         isAdmin: false,
//         primaryFamily: false,
//         createDate: moment().format("YYYYMMDD"), 
//         modifyDate: null
//       }
//     });
//   });

//   test("not found for no such familyId", async function () {
//     const resp = await request(app)
//         .get(`/users/${testUserIds[0]}/families/0`);
//     expect(resp.statusCode).toEqual(404);
//   });

//   test("bad request if not a member of family", async function () {
//     const resp = await request(app)
//         .get(`/users/${testUserIds[0]}/families/${testFamilyIds[1]}`);
//     expect(resp.statusCode).toEqual(400);
//   });
// });

// // /************************************** PATCH /users/:id/families/:familyId */

// describe("PATCH /users/:id/families/:familyId", function () {
//   test("works for change in status", async function () {
//     const resp = await request(app)
//         .patch(`/users/${testUserIds[0]}/families/${testFamilyIds[0]}`)
//         .send({
//           "status":"inactive"
//         });
//     expect(resp.body).toEqual({
//       updatedStatus: 
//         { 
//           familyId: testFamilyIds[0], 
//           status: "inactive",
//           isAdmin: false,
//           primaryFamily: false,
//           createDate: moment().format("YYYYMMDD"),
//           modifyDate: moment().format("YYYYMMDD")
//         }
//     });
//   });

//   test("works for change in isAdmin", async function () {
//     const resp = await request(app)
//         .patch(`/users/${testUserIds[0]}/families/${testFamilyIds[0]}`)
//         .send({
//           "isAdmin":true
//         });
//     expect(resp.body).toEqual({
//       updatedStatus: 
//         { 
//           familyId: testFamilyIds[0], 
//           status: "active",
//           isAdmin: true,
//           primaryFamily: false,
//           createDate: moment().format("YYYYMMDD"),
//           modifyDate: moment().format("YYYYMMDD")
//         }
//     });
//   });

//   test("works for change in primaryFamily", async function () {
//     const resp = await request(app)
//         .patch(`/users/${testUserIds[0]}/families/${testFamilyIds[0]}`)
//         .send({
//           "primaryFamily":true
//         });
//     expect(resp.body).toEqual({
//       updatedStatus: 
//         { 
//           familyId: testFamilyIds[0], 
//           status: "active",
//           isAdmin: false,
//           primaryFamily: true,
//           createDate: moment().format("YYYYMMDD"),
//           modifyDate: moment().format("YYYYMMDD")
//         }
//     });
//   });

//   test("not found for no such familyId", async function () {
//     const resp = await request(app)
//         .patch(`/users/${testUserIds[0]}/families/0`)
//         .send({
//           "status":"inactive"
//         });
//     expect(resp.statusCode).toEqual(404);
//   });

//   test("bad request if not a member of family", async function () {
//     const resp = await request(app)
//         .patch(`/users/${testUserIds[0]}/families/${testFamilyIds[1]}`)        
//         .send({
//           "status":"inactive"
//         });
//     expect(resp.statusCode).toEqual(400);
//   });
// });