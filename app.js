const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const path = require("path");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "twitterClone.db");
let database = null;

const initializationDbAndServer = async () => {
  try {
    database = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
  }
};

initializationDbAndServer();

const getUserAvailable = async (request, response, next) => {
  const { username } = request.body;
  const getRegisterQuery = `SELECT * FROM user WHERE username='${username}';`;
  const dbUser = await database.get(getRegisterQuery);
  request.dbUser = dbUser;
  next();
};

const authenticateToken = async (request, response, next) => {
  const { username, password } = request.body;
  let jwtToken = null;
  const authHeaders = request.headers["authorization"];
  console.log(1);
  if (authHeaders !== undefined) {
    jwtToken = authHeaders.split(" ")[1];
  }
  if (jwtToken === undefined) {
    response.status(401);
    response.send("Invalid JWT Token");
  } else {
    jwt.verify(jwtToken, "MY_SECRET_TOKEN", async (error, payload) => {
      if (error) {
        response.status(401);
        response.send("Invalid JWT Token");
      } else {
        request.username = payload.username;
        next();
      }
    });
  }
};

// REGISTER API

app.post("/register/", getUserAvailable, async (request, response) => {
  const { username, password, name, gender } = request.body;
  const { dbUser } = request;

  if (dbUser === undefined) {
    if (password.length > 6) {
      const hastedPassword = await bcrypt.hash(password, 10);
      const addUserItem = `
            INSERT INTO 
                user(username, password, name, gender) 
                VALUES('${username}', '${hastedPassword}', '${name}', '${gender}');`;

      await database.run(addUserItem);
      response.send("User created successfully");
    } else {
      response.status(400);
      response.send("Password is too short");
    }
  } else {
    response.status(400);
    response.send("User already exists");
  }
});

// Login API

app.post("/login/", getUserAvailable, async (request, response) => {
  const { username, password } = request.body;
  const { dbUser } = request;
  if (dbUser === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const isPasswordMatched = await bcrypt.compare(password, dbUser.password);
    if (isPasswordMatched) {
      const payload = { username: username };
      const jwtToken = await jwt.sign(payload, "MY_SECRET_TOKEN");
      response.send({ jwtToken });
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

// GET Tweet API

app.get("/user/tweets/feed/", authenticateToken, async (request, response) => {
  //   const getUserTweetQuery = `SELECT username, tweet, dateTime FROM user WHERE user NATURAL JOIN tweet;`;
  //   const dbResponse = await database.all(getUserTweetQuery);
  //   response.send(dbResponse);
  console.log("hello");
});
