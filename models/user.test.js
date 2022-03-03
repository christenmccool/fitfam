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

  test("works", async function () {
    let user = await User.create({
      ...newUser,
      password: "password-new"
    });

    expect(user).toEqual({
      ...newUser,
      id: expect.any(Number),
      imageUrl: null,
      bio: null,
      createDate: moment().format("YYYYMMDD"),
      password: undefined,
      modifyDate: undefined,
      families: undefined
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
        imageUrl: null,
        bio: null,
        createDate: moment().format("YYYYMMDD"),
        modifyDate: null,
        password: undefined,
        families: undefined
      },
      {
        id: testUserIds[1],
        email: "u2@mail.com",
        firstName: "First2",
        lastName: "Last2",
        imageUrl: "user2image.com",
        bio: null,
        createDate: moment().format("YYYYMMDD"),
        modifyDate: null,
        password: undefined,
        families: undefined
      },
      {
        id: testUserIds[2],
        email: "u3@mail.com",
        firstName: "First3",
        lastName: "Last3",
        imageUrl: "user3image.com",
        bio: "Bio of u3",
        createDate: moment().format("YYYYMMDD"),
        modifyDate: null,
        password: undefined,
        families: undefined
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
        imageUrl: null,
        bio: null,
        createDate: moment().format("YYYYMMDD"),
        modifyDate: null,
        password: undefined,
        families: undefined
      },
      {
        id: testUserIds[1],
        email: "u2@mail.com",
        firstName: "First2",
        lastName: "Last2",
        imageUrl: "user2image.com",
        bio: null,
        createDate: moment().format("YYYYMMDD"),
        modifyDate: null,
        password: undefined,
        families: undefined
      },
      {
        id: testUserIds[2],
        email: "u3@mail.com",
        firstName: "First3",
        lastName: "Last3",
        imageUrl: "user3image.com",
        bio: "Bio of u3",
        createDate: moment().format("YYYYMMDD"),
        modifyDate: null,
        password: undefined,
        families: undefined
      },
      {
        id: expect.any(Number),
        email: "new@mail.com",
        firstName: "First-new",
        lastName: "Last-new",     
        imageUrl: null,
        bio: null,
        createDate: moment().format("YYYYMMDD"),
        modifyDate: null,
        password: undefined,
        families: undefined
      }
    ]);
  });
});

/************************************** find */

describe("find", function () {
  test("works", async function () {
    let user = await User.find(testUserIds[0]);

    expect(user).toEqual({
      id: testUserIds[0],
      firstName: "First1",
      lastName: "Last1",
      email: "u1@mail.com",
      imageUrl: null,
      bio: null,
      createDate: moment().format("YYYYMMDD"),
      modifyDate: null,
      password: undefined,
      families: [
        {
          familyId: testFamilyIds[0],
          familyName: "fam1",
          isAdmin: false,
          createDate: moment().format("YYYYMMDD"),
          modifyDate: null,
          primaryFamily: false,
          status: "active",
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

/************************************** update */

describe("update", function () {
  const updateData = {
    firstName: "NewF",
    lastName: "NewL",
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
      password: undefined,
      families: undefined,
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

/************************************** remove */

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

/************************************** joinFamily */

describe("joinFamily", function () {
  test("works", async function () {
    let user = await User.find(testUserIds[0]);
    let familyStatus = await user.joinFamily(testFamilyIds[1]);

    expect(familyStatus).toEqual({
      familyId: testFamilyIds[1],
      status: "active",
      isAdmin: false,
      primaryFamily: false,
      createDate: moment().format("YYYYMMDD")
    });

    const res = await db.query(
        "SELECT * FROM users_families WHERE family_id=$1", [testFamilyIds[1]]);

    expect(res.rows).toEqual([
      {
        user_id: testUserIds[0],
        family_id: testFamilyIds[1],
        family_status: "active",
        is_admin: false,
        primary_family: false,
        create_date: expect.any(Date),
        modify_date: null
      }
    ]);
  });

  test("not found if no such family", async function () {
    try {
      let user = await User.find(testUserIds[0]);
      await user.joinFamily(0);
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });

  test("bad request if user already in family", async function () {
    try {
      let user = await User.find(testUserIds[0]);
      await user.joinFamily(testFamilyIds[0]);
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

/************************************** findFamilies */
describe("findFamilies", function () {
  test("works", async function () {
    let user = await User.find(testUserIds[0]);
    let families = await user.findFamilies();

    expect(families).toEqual([
      {
        familyId: testFamilyIds[0],
        familyName: "fam1",
        status: "active",
        isAdmin: false,
        primaryFamily: false,
        createDate: moment().format("YYYYMMDD"),
        modifyDate: null
      }
    ]);
  });

  test("works after adding family", async function () {
    let user = await User.find(testUserIds[0]);
    await user.joinFamily(testFamilyIds[1]);
    let families = await user.findFamilies();

    expect(families).toEqual([
      {
        familyId: testFamilyIds[0],
        familyName: "fam1",
        status: "active",
        isAdmin: false,
        primaryFamily: false,
        createDate: moment().format("YYYYMMDD"),
        modifyDate: null
      },
      {
        familyId: testFamilyIds[1],
        familyName: "fam2",
        status: "active",
        isAdmin: false,
        primaryFamily: false,
        createDate: moment().format("YYYYMMDD"),
        modifyDate: null
      }
    ]);
  });
});

/************************************** findFamilyStatus */
describe("findFamily", function () {
  test("works", async function () {
    let user = await User.find(testUserIds[0]);
    let familyStatus = await user.findFamilyStatus(testFamilyIds[0]);

    expect(familyStatus).toEqual({
      familyId: testFamilyIds[0],
      status: "active",
      isAdmin: false,
      primaryFamily: false,
      createDate: moment().format("YYYYMMDD"),
      modifyDate: null
    })
  });

  test("not found if no such family", async function () {
    try {
      let user = await User.find(testUserIds[0]);
      await user.findFamilyStatus(0);
    } catch(err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  })

  test("bad request if not a member of family", async function () {
    try {
      let user = await User.find(testUserIds[0]);
      await user.findFamilyStatus(testFamilyIds[1]);
    } catch(err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  })
});

/************************************** updateFamilyStatus */
describe("updateFamilyStatus", function () {
  const updateData = {
    status: "pending",
    isAdmin: true,
    primaryFamily: true
  };

  test("works", async function () {
    let user = await User.find(testUserIds[0]);
    let updatedStatus = await user.updateFamilyStatus(testFamilyIds[0], updateData);

    expect(updatedStatus).toEqual({
      ...updateData,
      familyId: testFamilyIds[0],
      createDate: moment().format("YYYYMMDD"),
      modifyDate: moment().format("YYYYMMDD")
    })
  })

  test("not found if no such family", async function () {
    try {
      let user = await User.find(testUserIds[0]);
      await user.updateFamilyStatus(0, updateData);
    } catch(err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  })

  test("bad request if not a member of family", async function () {
    try {
      let user = await User.find(testUserIds[0]);
      await user.updateFamilyStatus(testFamilyIds[1], updateData);
    } catch(err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  })
});