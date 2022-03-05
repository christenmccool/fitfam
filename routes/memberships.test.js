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


/************************************** POST /memberships */

describe("POST /memberships", function () {
  test("works with required data", async function () {
    const data = {
      userId: testUserIds[2],
      familyId: testFamilyIds[0]
    };

    const resp = await request(app)
        .post("/memberships")
        .send(data);
    expect(resp.statusCode).toEqual(201);
    expect(resp.body).toEqual({
      membership: {
        ...data,
        memStatus: "active",
        isAdmin: false,
        primaryFamily: false,
        createDate: moment().format("YYYYMMDD")
      }
    });
  });

  test("works with optional data", async function () {
    const data = {
      userId: testUserIds[2],
      familyId: testFamilyIds[0],        
      memStatus: "pending",
      isAdmin: true,
      primaryFamily: true
    };

    const resp = await request(app)
        .post("/memberships")
        .send(data);
    expect(resp.statusCode).toEqual(201);
    expect(resp.body).toEqual({
      membership: {
        ...data,
        createDate: moment().format("YYYYMMDD")
      }
    });
  });

  test("bad request if missing data - familyId", async function () {
    const resp = await request(app)
        .post("/memberships")
        .send({
          userId: testUserIds[0]
        });
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request if extra data", async function () {
    const resp = await request(app)
        .post("/memberships")
        .send({
          userId: testUserIds[2],
          familyId: testFamilyIds[0],
          extra: "extra-info"
        });
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request if invalid data - memStatus", async function () {
    const resp = await request(app)
        .post("/memberships")
        .send({
          userId: testUserIds[2],
          familyId: testFamilyIds[0],
          memStatus: "fake"
        });
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request if invalid data - isAdmin not boolean", async function () {
    const resp = await request(app)
        .post("/memberships")
        .send({
          userId: testUserIds[2],
          familyId: testFamilyIds[0],
          isAdmin: "string"
        });
    expect(resp.statusCode).toEqual(400);
  });
});

// /************************************** GET /memberships */

describe("GET /memberships", function () {
  test("works", async function () {
    const resp = await request(app).get("/memberships");
    expect(resp.body).toEqual({
      memberships: [
        {
          userId: testUserIds[0],
          familyId: testFamilyIds[0],
          memStatus: "active",
          isAdmin: false,
          primaryFamily: false,
          createDate: moment().format("YYYYMMDD"),
          modifyDate: null
        },
        {
          userId: testUserIds[0],
          familyId: testFamilyIds[1],
          memStatus: "active",
          isAdmin: false,
          primaryFamily: false,
          createDate: moment().format("YYYYMMDD"),
          modifyDate: null
        },
        {
          userId: testUserIds[1],
          familyId: testFamilyIds[0],
          memStatus: "active",
          isAdmin: false,
          primaryFamily: false,
          createDate: moment().format("YYYYMMDD"),
          modifyDate: null
        }
      ]
    });
  });

  test("works for search filter -- userId only", async function () {
    const resp = await request(app).get(`/memberships?userId=${testUserIds[0]}`);
    expect(resp.body).toEqual({
      memberships: [
        {
          userId: testUserIds[0],
          familyId: testFamilyIds[0],
          memStatus: "active",
          isAdmin: false,
          primaryFamily: false,
          createDate: moment().format("YYYYMMDD"),
          modifyDate: null
        },
        {
          userId: testUserIds[0],
          familyId: testFamilyIds[1],
          memStatus: "active",
          isAdmin: false,
          primaryFamily: false,
          createDate: moment().format("YYYYMMDD"),
          modifyDate: null
        }
      ]
    });
  });

  test("works for search filter -- familyId only", async function () {
    const resp = await request(app).get(`/memberships?familyId=${testFamilyIds[0]}`);
    expect(resp.body).toEqual({
      memberships: [
        {
          userId: testUserIds[0],
          familyId: testFamilyIds[0],
          memStatus: "active",
          isAdmin: false,
          primaryFamily: false,
          createDate: moment().format("YYYYMMDD"),
          modifyDate: null
        },
        {
          userId: testUserIds[1],
          familyId: testFamilyIds[0],
          memStatus: "active",
          isAdmin: false,
          primaryFamily: false,
          createDate: moment().format("YYYYMMDD"),
          modifyDate: null
        }
      ]
    });
  });

  test("works for search filter -- userId and familyId", async function () {
    const resp = await request(app).get(`/memberships?userId=${testUserIds[0]}&familyId=${testFamilyIds[0]}`);
    expect(resp.body).toEqual({
      memberships: [
        {
          userId: testUserIds[0],
          familyId: testFamilyIds[0],
          memStatus: "active",
          isAdmin: false,
          primaryFamily: false,
          createDate: moment().format("YYYYMMDD"),
          modifyDate: null
        }
      ]
    });
  });

  test("works for search filter -- isAdmin with match", async function () {
    const resp = await request(app).get(`/memberships?isAdmin=false`);
    expect(resp.body).toEqual({
      memberships: [
        {
          userId: testUserIds[0],
          familyId: testFamilyIds[0],
          memStatus: "active",
          isAdmin: false,
          primaryFamily: false,
          createDate: moment().format("YYYYMMDD"),
          modifyDate: null
        },
        {
          userId: testUserIds[0],
          familyId: testFamilyIds[1],
          memStatus: "active",
          isAdmin: false,
          primaryFamily: false,
          createDate: moment().format("YYYYMMDD"),
          modifyDate: null
        },
        {
          userId: testUserIds[1],
          familyId: testFamilyIds[0],
          memStatus: "active",
          isAdmin: false,
          primaryFamily: false,
          createDate: moment().format("YYYYMMDD"),
          modifyDate: null
        }
      ]
    });
  });

  test("works for search filter -- isAdmin with no match", async function () {
    const resp1 = await request(app).get(`/memberships?isAdmin=true`);
    expect(resp1.body).toEqual({
      memberships: []
    });

    const resp2 = await request(app).get(`/memberships?isAdmin`);
    expect(resp2.body).toEqual({
      memberships: []
    });
  });

});

// /************************************** GET /memberships/:userId-:familyId */

describe("GET /memberships/:userId-:familyId ", function () {
  test("works", async function () {
    const resp = await request(app).get(`/memberships/${testUserIds[0]}-${testFamilyIds[0]}`);
    expect(resp.body).toEqual({
      membership: {
        userId: testUserIds[0],
        familyId: testFamilyIds[0],
        memStatus: "active",
        isAdmin: false,
        primaryFamily: false,
        createDate: moment().format("YYYYMMDD"),
        modifyDate: null
      }
    });
  });

  test("not found if user not found", async function () {
    const resp = await request(app).get(`/memberships/0-${testFamilyIds[0]}`);
    expect(resp.statusCode).toEqual(404);
  });
});

/************************************** PATCH /memberships/:userId-:familyId */

describe("PATCH /memberships/:userId-:familyId", () => {
  test("works", async function () {
    const updateData = {
      memStatus: "pending",
      isAdmin: true,
      primaryFamily: true
    };

    const resp = await request(app)
        .patch(`/memberships/${testUserIds[0]}-${testFamilyIds[0]}`)
        .send(updateData);
    expect(resp.body).toEqual({
      membership: {
        userId: testUserIds[0],
        familyId: testFamilyIds[0],
        memStatus: "pending",
        isAdmin: true,
        primaryFamily: true,
        createDate: moment().format("YYYYMMDD"),
        modifyDate: moment().format("YYYYMMDD")
      }
    });
  });

  test("bad request if no data", async function () {
    const resp = await request(app)
        .patch(`/memberships/${testUserIds[0]}-${testFamilyIds[0]}`)
        .send({});
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request if extra data", async function () {
    const updateData = {
      memStatus: "pending",
      isAdmin: true,
      primaryFamily: true,
      extra: "extra-info"
    };

    const resp = await request(app)
        .patch(`/memberships/${testUserIds[0]}-${testFamilyIds[0]}`)
        .send(updateData);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request if invalid data - memStatus", async function () {
    const resp = await request(app)
        .patch(`/memberships/${testUserIds[0]}-${testFamilyIds[0]}`)
        .send({
          memStatus: "fake"
        });
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request if invalid data - isAdmin not boolean", async function () {
    const resp = await request(app)
        .patch(`/memberships/${testUserIds[0]}-${testFamilyIds[0]}`)
        .send({
          isAdmin: "string"
        });
    expect(resp.statusCode).toEqual(400);
  });
});

/************************************** DELETE /memberships/:userId-:familyId */

describe("DELETE /memberships/:userId-:familyId", function () {
  test("works", async function () {
    const resp = await request(app).delete(`/memberships/${testUserIds[0]}-${testFamilyIds[0]}`);
    expect(resp.body).toEqual({ deleted: `${testUserIds[0]}-${testFamilyIds[0]}` });
  });

});
