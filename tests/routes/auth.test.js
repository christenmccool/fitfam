"use strict";

const request = require("supertest");

const app = require("../../app");

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  testUserIds
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** POST /auth/token */

describe("POST /auth/login", function () {
  test("works", async function () {
    const resp = await request(app)
        .post("/auth/login")
        .send({
          email: "u1@mail.com",
          password: "password",
        });
    expect(resp.body).toEqual({
      "token": expect.any(String),
    });
  });

  test("unauth when user doesn't exist", async function () {
    const resp = await request(app)
        .post("/auth/login")
        .send({
          email: "fake@mail.com",
          password: "password",
        });
    expect(resp.statusCode).toEqual(401);
  });

  test("unauth with wrong password", async function () {
    const resp = await request(app)
        .post("/auth/login")
        .send({
          email: "u1@mail.com",
          password: "fake",
        });
    expect(resp.statusCode).toEqual(401);
  });

  test("bad request with missing data", async function () {
    const resp = await request(app)
        .post("/auth/login")
        .send({
          email: "u1@mail.com"
        });
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request with invalid data - email ", async function () {
    const resp = await request(app)
        .post("/auth/login")
        .send({
          email: "u1",
          password: "password",
        });
    expect(resp.statusCode).toEqual(400);
  });
});

/************************************** POST /auth/register */

describe("POST /auth/register", function () {
  test("works for anon", async function () {
    const resp = await request(app)
        .post("/auth/register")
        .send({
          email: "new@mail.com",
          firstName: "first",
          lastName: "last",
          password: "password"
    });
    expect(resp.statusCode).toEqual(201);
    expect(resp.body).toEqual({
      "token": expect.any(String),
    });
  });

  test("bad request with missing fields", async function () {
    const resp = await request(app)
        .post("/auth/register")
        .send({
          email: "new@mail.com"
        });
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request with invalid data - email", async function () {
    const resp = await request(app)
        .post("/auth/register")
        .send({
          email: "u1",
          firstName: "first",
          lastName: "last",
          password: "password",
        });
    expect(resp.statusCode).toEqual(400);
  });
});
