const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const bcrypt = require("bcrypt");

const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "goodreads.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

// Get Books API
app.get("/books/", async (request, response) => {
  const getBooksQuery = `
  SELECT
    *
  FROM
    book
  ORDER BY
    book_id;`;
  const booksArray = await db.all(getBooksQuery);
  response.send(booksArray);
});

//Register user
app.post("/users/", async (request, response) => {
  const { username, name, location, password, gender } = request.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const searchUserQuery = `
    SELECT * 
    FROM user
    WHERE username = '${username}';`;
  const searchUser = await db.get(searchUserQuery);
  if (searchUser === undefined) {
    //create a user row in table
    const createUserQuery = `
        INSERT INTO user(username, name, password, gender, location)
        VALUES('${username}', '${name}', '${hashedPassword}', '${gender}', '${location}');`;
    const createdUser = await db.run(createUserQuery);
    response.send("User Created Successfully");
  } else {
    response.status(400);
    response.send("User already exists");
  }
});

//check login details
app.post("/login/", async (request, response) => {
  const { username, password } = request.body;
  const searchUserQuery = `
    SELECT * 
    FROM user 
    WHERE username = '${username}';`;
  const dbUser = await db.get(searchUserQuery);
  if (dbUser === undefined) {
    response.status(400);
    response.send("User doesn't exit");
  } else {
    const passwordMatched = await bcrypt.compare(password, dbUser.password);
    if (passwordMatched === true) {
      response.send("password successfully matched");
    } else {
      response.status(400);
      response.send("Invaild password");
    }
  }
});
