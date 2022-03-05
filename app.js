"use strict";

/** Express app for FitFam. */

const express = require("express");

const { NotFoundError } = require("./expressError");


const userRoutes = require("./routes/users");
const famiyRoutes = require("./routes/families");
const membershipRoutes = require("./routes/memberships");
const workoutRoutes = require("./routes/workouts");
const resultRoutes = require("./routes/results");
const commentRoutes = require("./routes/comments");

const app = express();

app.use(express.json());

app.use("/users", userRoutes);
app.use("/families", famiyRoutes);
app.use("/memberships", membershipRoutes);
app.use("/workouts", workoutRoutes);
app.use("/results", resultRoutes);
app.use("/comments", commentRoutes);


/** 404 handler */
app.use(function (req, res, next) {
  return next(new NotFoundError());
});

/** Error handler */
app.use(function (err, req, res, next) {
  if (process.env.NODE_ENV !== "test") console.error(err.stack);
  const status = err.status || 500;
  const message = err.message;

  return res.status(status).json({
    error: { message, status },
  });
});

module.exports = app;