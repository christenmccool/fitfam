"use strict";

const {
  NotFoundError,
  BadRequestError,
} = require("../expressError");

const db = require("../db.js");
const moment = require("moment");

const User = require("./user.js");
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

/************************************** create */

describe("create", function () {
  const newUser = {
    email: "new@mail.com",
    firstName: "First-new",
    lastName: "Last-new"
  };

  test("works with required data", async function () {
    let user = await User.create({
      ...newUser,
      password: "password-new"
    });

    expect(user).toEqual({
      ...newUser,
      id: expect.any(Number),
      userStatus: "active",
      createDate: moment().format("YYYYMMDD"),
      imageUrl: null,
      bio: null
    });

    const found = await db.query("SELECT * FROM users WHERE email = 'new@mail.com'");
    expect(found.rows.length).toEqual(1);
    expect(found.rows[0].first_name).toEqual('First-new');
  });

  test("works with optional data", async function () {
    let user = await User.create({
      ...newUser,
      password: "password-new",
      bio: "Bio of new user"
    });

    expect(user).toEqual({
      ...newUser,
      id: expect.any(Number),
      userStatus: "active",
      createDate: moment().format("YYYYMMDD"),
      bio: "Bio of new user",
      imageUrl: null
    });

    const found = await db.query("SELECT * FROM users WHERE email = 'new@mail.com'");
    expect(found.rows.length).toEqual(1);
    expect(found.rows[0].first_name).toEqual('First-new');
  });

  test("bad request with duplicate data", async function () {
    try {
      await User.create({
        ...newUser,
        password: "password-new",
      });
      await User.create({
        ...newUser,
        password: "password-new",
      });
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

/************************************** findAll */

describe("findAll", function () {
  test("works", async function () {
    const users = await User.findAll();

    expect(users).toEqual([
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
    ]);
  });

  test("works after adding new user", async function () {
    const user = await User.create({
      email: "new@mail.com",
      firstName: "First-new",
      lastName: "Last-new",      
      password: "password-new"
    });

    const users = await User.findAll();
    expect(users).toEqual([
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
      },
      {
        id: expect.any(Number),
        email: "new@mail.com",
        firstName: "First-new",
        lastName: "Last-new",     
        userStatus: "active",
        bio: null
      }
    ]);
  });

  test("works for search filter -- firstName partial match", async function () {
    const users = await User.findAll({"firstName": "First"});
    expect(users).toEqual([
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
    ]);
  });

  test("works for search filter -- partial firstName complete match", async function () {
    const users = await User.findAll({"firstName": "First1"});
    expect(users).toEqual([
      {
        id: testUserIds[0],
        email: "u1@mail.com",
        firstName: "First1",
        lastName: "Last1",
        userStatus: "active",
        bio: null
      }
    ]);
  });

  test("works for search filter -- bio key word", async function () {
    const users1 = await User.findAll({"bio": "u3"});
    expect(users1).toEqual([
      {
        id: testUserIds[2],
        email: "u3@mail.com",
        firstName: "First3",
        lastName: "Last3",
        userStatus: "active",
        bio: "Bio of u3"
      }
    ]);

    const users2 = await User.findAll({"bio": "fake"});
    expect(users2).toEqual([]);
  });

  test("works for search filter -- userStatus", async function () {
    const users1 = await User.findAll({"userStatus": "active"});
    expect(users1).toEqual([
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
    ]);

    const users2 = await User.findAll({"userStatus": "pending"});
    expect(users2).toEqual([]);
  });

});

// /************************************** find */

describe("find", function () {
  test("works", async function () {
    let user = await User.find(testUserIds[0]);

    expect(user).toEqual({
      id: testUserIds[0],
      firstName: "First1",
      lastName: "Last1",
      email: "u1@mail.com",
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
        },
      ]
    });
  });

  test("not found if no such user", async function () {
    try {
      await User.find(0);
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

// /************************************** update */

describe("update", function () {
  const updateData = {
    firstName: "NewF",
    lastName: "NewL",
    userStatus: "blocked",
    imageUrl: "newimage.com",
    bio: "Bio of new user"
  };

  test("works", async function () {
    let user = await User.find(testUserIds[0]);
    let updatedUser = await user.update(updateData);

    expect(updatedUser).toEqual({
      id: testUserIds[0],
      email: "u1@mail.com",
      createDate: moment().format("YYYYMMDD"),
      modifyDate: moment().format("YYYYMMDD"),
      ...updateData
    });
  });

  test("not found if no such user", async function () {
    try {
      let user = await User.find(0);
      await user.update(updateData);
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

// /************************************** remove */

describe("remove", function () {
  test("works", async function () {
    let user = await User.find(testUserIds[0]);
    await user.remove();

    const res = await db.query(
        `SELECT * FROM users WHERE id=${testUserIds[0]}`
    );
    expect(res.rows.length).toEqual(0);
  });

  test("not found if no such user", async function () {
    try {
      let user = await User.find(0);
      await user.remove();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

