"use strict";

const {
  NotFoundError,
  BadRequestError,
} = require("../expressError");

const db = require("../db.js");
const moment = require("moment");

const Membership = require("./membership.js");
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
  test("works with required data", async function () {
    const newMembership = {
      userId: testUserIds[2],
      familyId: testFamilyIds[0]
    };
    let membership = await Membership.create(newMembership);

    expect(membership).toEqual({
      ...newMembership,
      memStatus: "active",
      isAdmin: false,
      primaryFamily: false,
      createDate: moment().format("YYYYMMDD"),
      modifyDate: null
    });

    const found = await db.query(
      "SELECT * FROM users_families WHERE user_id=$1 AND family_id=$2", [testUserIds[2], testFamilyIds[0]]
    );

    expect(found.rows).toEqual([
      {
        user_id: testUserIds[2],
        family_id: testFamilyIds[0],
        mem_status: "active",
        is_admin: false,
        primary_family: false,
        create_date: expect.any(Date),
        modify_date: null
      }
    ]);
  });

  test("works with optional data", async function () {
    const newMembership = {
      userId: testUserIds[2],
      familyId: testFamilyIds[0],
      memStatus: "pending",
      isAdmin: true,
      primaryFamily: true
    };
    
    let membership = await Membership.create(newMembership);

    expect(membership).toEqual({
      ...newMembership,
      createDate: moment().format("YYYYMMDD"),
      modifyDate: null
    });

    const found = await db.query(
      "SELECT * FROM users_families WHERE user_id=$1 AND family_id=$2", [testUserIds[2], testFamilyIds[0]]
    );

    expect(found.rows).toEqual([
      {
        user_id: testUserIds[2],
        family_id: testFamilyIds[0],
        mem_status: "pending",
        is_admin: true,
        primary_family: true,
        create_date: expect.any(Date),
        modify_date: null
      }
    ]);
  });

  test("not found if no such user", async function () {
    try {
      await Membership.create({
        userId: 0,
        familyId: testFamilyIds[0]
      });
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });

  test("not found if no such family", async function () {
    try {
      await Membership.create({
        userId: testUserIds[0],
        familyId: 0
      });
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });

  test("bad request with duplicate data (user already in family)", async function () {
    const newMembership = {
      userId: testUserIds[0],
      familyId: testFamilyIds[1]
    };

    try {
      await Membership.create(newMembership);
      await Membership.create(newMembership);
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

/************************************** findAll */

describe("findAll", function () {
  test("works", async function () {
    const memberships = await Membership.findAll();

    expect(memberships).toEqual([
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
    ]);
  });

  test("works after adding new membership", async function () {
    await Membership.create({
      userId: testUserIds[2],
      familyId: testFamilyIds[0]
    });

    const memberships = await Membership.findAll();
    expect(memberships).toEqual([
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
      },
      {
        userId: testUserIds[2],
        familyId: testFamilyIds[0],
        memStatus: "active",
        isAdmin: false,
        primaryFamily: false,
        createDate: moment().format("YYYYMMDD"),
        modifyDate: null
      }
    ]);
  });

  test("works for search filter -- userId only", async function () {
    const memberships = await Membership.findAll({"userId": testUserIds[0]});
    expect(memberships).toEqual([
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
    ]);
  });

  test("works for search filter -- familyId only", async function () {
    const memberships = await Membership.findAll({"familyId": testFamilyIds[0]});
    expect(memberships).toEqual([
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
      },
    ]);
  });


  test("works for search filter -- userId and familyId", async function () {
    const memberships = await Membership.findAll({
      "userId": testUserIds[0],
      "familyId": testFamilyIds[0]
    });
    expect(memberships).toEqual([
      {
        userId: testUserIds[0],
        familyId: testFamilyIds[0],
        memStatus: "active",
        isAdmin: false,
        primaryFamily: false,
        createDate: moment().format("YYYYMMDD"),
        modifyDate: null
      }
    ]);
  });

  test("works for search filter -- isAdmin", async function () {
    const memberships = await Membership.findAll({"isAdmin": false});
    expect(memberships).toEqual([
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
      },
    ]);
  });

  test("works for search filter -- memStatus", async function () {
    const memberships1 = await Membership.findAll({"memStatus": "active"});
    expect(memberships1).toEqual([
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
      },
    ]);

    const memberships2 = await Membership.findAll({"memStatus": "pending"});
    expect(memberships2).toEqual([]);
  });
});

// /************************************** find */

describe("find", function () {
  test("works", async function () {
    let membership = await Membership.find(testUserIds[0], testFamilyIds[0]);

    expect(membership).toEqual({
      userId: testUserIds[0],
      familyId: testFamilyIds[0],
      memStatus: "active",
      isAdmin: false,
      primaryFamily: false,
      createDate: moment().format("YYYYMMDD"),
      modifyDate: null 
    });
  });

  test("not found if no such user", async function () {
    try {
      await Membership.find(0, testFamilyIds[0]);
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });

  test("not found if no such family", async function () {
    try {
      await Membership.find(testUserIds[0], 0);
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });

  test("not found if no membership between user and family", async function () {
    try {
      await Membership.find(testUserIds[2], testFamilyIds[0]);
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

// /************************************** update */

describe("update", function () {
  const updateData = {
    memStatus: "pending",
    isAdmin: true,
    primaryFamily: true
  };

  test("works", async function () {
    let membership = await Membership.find(testUserIds[0], testFamilyIds[0]);
    let updatedMembershp = await membership.update(updateData);

    expect(updatedMembershp).toEqual({
      ...updateData,
      userId: testUserIds[0],
      familyId: testFamilyIds[0],
      createDate: moment().format("YYYYMMDD"),
      modifyDate: moment().format("YYYYMMDD"), 
    });
  });
});

// /************************************** remove */

describe("remove", function () {
  test("works", async function () {
    let membership = await Membership.find(testUserIds[0], testFamilyIds[0]);
    await membership.remove();

    const res = await db.query(
        `SELECT * FROM users_families WHERE user_id=${testUserIds[0]} AND family_id=${testFamilyIds[0]}`
    );
    expect(res.rows.length).toEqual(0);
  });
});
