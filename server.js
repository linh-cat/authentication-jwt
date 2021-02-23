const express = require("express");
const bodyParser = require("body-parser");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./model/user");
const app = express();
const path = require("path");
const port = 3000;
const JWT_SECRET =
  "sdkfsfdrg[rdgfdlksrgfesfraoldjadalo12dsklfsmldsmflksmdkfrefn";

app.use(bodyParser.json());

app.use("/", express.static(path.join(__dirname, "static")));

mongoose
  .connect("mongodb://localhost:27017/login-app-db", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
  })
  .catch((error) => handleError(error));

// Add headers
app.use(function (req, res, next) {
  // Website you wish to allow to connect
  res.setHeader("Access-Control-Allow-Origin", "http://127.0.0.1:5500");

  // Request methods you wish to allow
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, OPTIONS, PUT, PATCH, DELETE"
  );

  // Request headers you wish to allow
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-Requested-With,content-type"
  );

  // Set to true if you need the website to include cookies in the requests sent
  // to the API (e.g. in case you use sessions)
  res.setHeader("Access-Control-Allow-Credentials", true);

  // Pass to next layer of middleware
  next();
});

app.post("/api/register", async (req, res) => {
  const { username, password: plainTextPassword } = req.body;

  if (!username || typeof username !== "string") {
    return res.json({ status: "ERROR", message: "Invalid username!" });
  }
  if (!plainTextPassword || typeof plainTextPassword !== "string") {
    return res.json({ status: "ERROR", message: "Invalid password!" });
  }
  if (plainTextPassword.length < 5) {
    return res.json({
      status: "error",
      message: "Password too small. Should be atleast 6 character",
    });
  }

  const password = await bcrypt.hash(plainTextPassword, 10);

  try {
    const response = await User.create({
      username,
      password,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.json({
        status: "ERROR",
        message: "User name already in use ",
      });
    }
    throw error;
  }

  res.json({
    status: "ok",
  });
});

app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;

  const user = await User.findOne({ username }).lean();

  if (!user) {
    return res.json({ status: "ERROR", message: "Invalid username/password" });
  }

  if (await bcrypt.compare(password, user.password)) {
    const token = jwt.sign(
      { id: user._id, username: user.username },
      JWT_SECRET
    );
    return res.json({ status: "ok", token: token });
  }

  res.json({ status: "ERROR", message: "Invalid username/password" });
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
