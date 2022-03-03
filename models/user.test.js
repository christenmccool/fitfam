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
  testFamilyIds
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** create */

describe("create", function () {
  const newUser = {
    username: "u-new",
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
      imageUrl: null,
      bio: null,
      joinDate: moment().format("YYYYMMDD"),
      password: undefined,
      families: undefined
    });

    const found = await db.query("SELECT * FROM users WHERE username = 'u-new'");
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
        username: "u1",
        firstName: "First1",
        lastName: "Last1",
        email: "u1@mail.com",
        imageUrl: null,
        bio: null,
        joinDate: moment().format("YYYYMMDD"),
        password: undefined,
        families: undefined
      },
      {
        username: "u2",
        firstName: "First2",
        lastName: "Last2",
        email: "u2@mail.com",
        imageUrl: "user2image.com",
        bio: null,
        joinDate: moment().format("YYYYMMDD"),
        password: undefined,
        families: undefined
      },
      {
        username: "u3",
        firstName: "First3",
        lastName: "Last3",
        email: "u3@mail.com",
        imageUrl: "user3image.com",
        bio: "Bio of u3",
        joinDate: moment().format("YYYYMMDD"),
        password: undefined,
        families: undefined
      }
    ]);
  });

  test("works after adding new user", async function () {
    await User.create({
      username: "u-new",
      email: "new@mail.com",
      firstName: "First-new",
      lastName: "Last-new",      
      password: "password-new"
    });

    const users = await User.findAll();
    expect(users).toEqual([
      {
        username: "u1",
        firstName: "First1",
        lastName: "Last1",
        email: "u1@mail.com",
        imageUrl: null,
        bio: null,
        joinDate: moment().format("YYYYMMDD"),
        password: undefined,
        families: undefined
      },
      {
        username: "u2",
        firstName: "First2",
        lastName: "Last2",
        email: "u2@mail.com",
        imageUrl: "user2image.com",
        bio: null,
        joinDate: moment().format("YYYYMMDD"),
        password: undefined,
        families: undefined
      },
      {
        username: "u3",
        firstName: "First3",
        lastName: "Last3",
        email: "u3@mail.com",
        imageUrl: "user3image.com",
        bio: "Bio of u3",
        joinDate: moment().format("YYYYMMDD"),
        password: undefined,
        families: undefined
      },
      {
        username: "u-new",
        email: "new@mail.com",
        firstName: "First-new",
        lastName: "Last-new",     
        imageUrl: null,
        bio: null,
        joinDate: moment().format("YYYYMMDD"),
        password: undefined,
        families: undefined
      }
    ]);
  });
});

/************************************** find */

describe("find", function () {
  test("works", async function () {
    let user = await User.find("u1");
    expect(user).toEqual({
      username: "u1",
      firstName: "First1",
      lastName: "Last1",
      email: "u1@mail.com",
      imageUrl: null,
      bio: null,
      joinDate: moment().format("YYYYMMDD"),
      password: undefined,
      families: [
        {
          familyId: testFamilyIds[0],
          familyname: "fam1",
          isAdmin: false,
          joinDate: moment().format("YYYYMMDD"),
          primaryFamily: false,
          status: "active",
        },
      ]
    });
  });

  test("not found if no such user", async function () {
    try {
      await User.find("fake");
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
    email: "new@mail.com",
    imageUrl: "newimage.com",
    bio: "Bio of new user"
  };

  test("works", async function () {
    let user = await User.find("u1");
    let updatedUser = await user.update(updateData);

    expect(updatedUser).toEqual({
      username: "u1",
      joinDate: moment().format("YYYYMMDD"),
      families: undefined,
      ...updateData
    });
  });

  test("not found if no such user", async function () {
    try {
      let user = await User.find("u1");
      await user.update(updateData);
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

/************************************** remove */

describe("remove", function () {
  test("works", async function () {
    let user = await User.find("u1");
    await user.remove();

    const res = await db.query(
        "SELECT * FROM users WHERE username='u1'"
    );
    expect(res.rows.length).toEqual(0);
  });

  test("not found if no such user", async function () {
    try {
      let user = await User.find("u1");
      await user.remove();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

/************************************** joinFamily */

describe("joinFamily", function () {
  test("works", async function () {
    let user = await User.find("u1");
    let familyStatus = await user.joinFamily(testFamilyIds[1]);

    expect(familyStatus).toEqual({
      familyId: testFamilyIds[1],
      status: "active",
      isAdmin: false,
      primaryFamily: false,
      joinDate: moment().format("YYYYMMDD")
    });

    const res = await db.query(
        "SELECT * FROM users_families WHERE family_id=$1", [testFamilyIds[1]]);

    expect(res.rows).toEqual([
      {
        username: 'u1',
        family_id: testFamilyIds[1],
        family_status: "active",
        is_admin: false,
        primary_family: false,
        join_date: expect.any(Date)
      }
    ]);
  });

  test("not found if no such family", async function () {
    try {
      let user = await User.find("u1");
      await user.joinFamily(0);
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });

  test("bad request if user already in family", async function () {
    try {
      let user = await User.find("u1");
      await user.joinFamily(testFamilyIds[0]);
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });

  /************************************** findFamilies */
  describe("findFamilies", function () {
    test("works", async function () {
      let user = await User.find("u1");
      let families = await user.findFamilies();
  
      expect(families).toEqual([
        {
          familyId: testFamilyIds[0],
          familyname: "fam1",
          status: "active",
          isAdmin: false,
          primaryFamily: false,
          joinDate: moment().format("YYYYMMDD")
        }
      ]);
    });

    test("works after adding family", async function () {
      let user = await User.find("u1");
      await user.joinFamily(testFamilyIds[1]);
      let families = await user.findFamilies();
  
      expect(families).toEqual([
        {
          familyId: testFamilyIds[0],
          familyname: "fam1",
          status: "active",
          isAdmin: false,
          primaryFamily: false,
          joinDate: moment().format("YYYYMMDD")
        },
        {
          familyId: testFamilyIds[1],
          familyname: "fam2",
          status: "active",
          isAdmin: false,
          primaryFamily: false,
          joinDate: moment().format("YYYYMMDD")
        }
      ]);
    });
  });

  /************************************** findFamilyStatus */
  describe("findFamily", function () {
    test("works", async function () {
      let user = await User.find("u1");
      let familyStatus = await user.findFamilyStatus(testFamilyIds[0]);

      expect(familyStatus).toEqual({
        familyId: testFamilyIds[0],
        status: "active",
        isAdmin: false,
        primaryFamily: false,
        joinDate: moment().format("YYYYMMDD")
      })
    });

    test("not found if no such family", async function () {
      try {
        let user = await User.find("u1");
        await user.findFamilyStatus(0);
      } catch(err) {
        expect(err instanceof NotFoundError).toBeTruthy();
      }
    })

    test("bad request if not a member of family", async function () {
      try {
        let user = await User.find("u1");
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
      let user = await User.find("u1");
      let updatedStatus = await user.updateFamilyStatus(testFamilyIds[0], 
                                                        updateData.status, 
                                                        updateData.isAdmin, 
                                                        updateData.primaryFamily
      );

      expect(updatedStatus).toEqual({
        familyId: testFamilyIds[0],
        status: "pending",
        isAdmin: true,
        primaryFamily: true,
        joinDate: moment().format("YYYYMMDD")
      })
    })

    test("not found if no such family", async function () {
      try {
        let user = await User.find("u1");
        await user.updateFamilyStatus(0, 
          updateData.status, 
          updateData.isAdmin, 
          updateData.primaryFamily
        );
      } catch(err) {
        expect(err instanceof NotFoundError).toBeTruthy();
      }
    })

    test("bad request if not a member of family", async function () {
      try {
        let user = await User.find("u1");
        await user.updateFamilyStatus(testFamilyIds[1], 
          updateData.status, 
          updateData.isAdmin, 
          updateData.primaryFamily
        );
      } catch(err) {
        expect(err instanceof BadRequestError).toBeTruthy();
      }
    })
  })
});