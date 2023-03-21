const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: __dirname + "/.env" });

const placesRoutes = require("./routes/places-routes");
const usersRoutes = require("./routes/users-routes");

const HttpError = require("./models/http-error");

const mongooseName = process.env["MONGOOSE_NAME"];
const mongoosePassword = process.env["MONGOOSE_PASSWORD"];
const mongooseDbName = process.env["MONGOOSE_DB_NAME"];
const connectionString = `mongodb+srv://${mongooseName}:${mongoosePassword}@cluster0.tggomuo.mongodb.net/${mongooseDbName}?retryWrites=true&w=majority`;

const app = express();

app.use(bodyParser.json());

app.use("/uploads/images", express.static(path.join("uploads", "images")));

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE");
  next();
});

app.use("/api/places", placesRoutes);

app.use("/api/users", usersRoutes);

app.use((req, res, next) => {
  const error = new HttpError("Could not find this route.", 404);
  throw error;
});

//General error handler
app.use((error, req, res, next) => {
  if (req.file) {
    fs.unlink(req.file.path, (err) => {
      console.log(err);
    });
  }
  if (res.headerSent) {
    return next(error);
  }
  res.status(error.code || 500);
  res.send({ message: error.message || "An unknown error occured!" });
});

mongoose
  .connect(connectionString)
  .then(() => {
    app.listen(5000);
  })
  .catch((error) => {
    console.log(error);
  });
