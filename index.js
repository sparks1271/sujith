const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const databasePath = path.join(__dirname, "covid19IndiaPortal.db");

const app = express();

app.use(express.json());

let database = null;

const initializeDbAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });

    app.listen(3000, () =>
      console.log("Server Running at http://localhost:3000/")
    );
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();
app.post("/users/", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  const hashedPassword = await bcrypt.hash(request.body.password, 10);
  const selectUserQuery = `SELECT * FROM user WHERE username = '${username}'`;
  const dbUser = await db.get(selectUserQuery);
  if (dbUser === undefined) {
    const createUserQuery = `
      INSERT INTO 
        user (username, name, password, gender, role) 
      VALUES 
        (
          '${username}', 
          '${name}',
          '${hashedPassword}', 
          '${gender}',
          '${role}'
        )`;
    const dbResponse = await db.run(createUserQuery);
    const newUserId = dbResponse.lastID;
    response.send(`Created new user with ${newUserId}`);
  } else {
    response.status = 400;
    response.send("User already exists");
  }
});

app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  const selectUserQuery = `SELECT * FROM user WHERE username = '${username}'`;
  const dbUser = await db.get(selectUserQuery);
  if (dbUser === undefined) {
    response.status(400);
    response.send("Invalid User");
  } else {
    const isPasswordMatched = await bcrypt.compare(password, dbUser.password);
    if (isPasswordMatched === true) {
      const payload = {
        username: username,
      };
      const jwtToken = jwt.sign(payload, "MY_SECRET_TOKEN");
      response.send({ jwtToken });
    } else {
      response.status(400);
      response.send("Invalid Password");
    }
  }
});

const authenticateToken = (request, response, next) => {
  let jwtToken;
  const authHeader = request.headers["authorization"];
  if (authHeader !== undefined) {
    jwtToken = authHeader.split(" ")[1];
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

app.post("/create-task/",authenticateToken, async(request,response)=>{
    let{username}=request;
    const addTask=request.body
    const {task,priority,status,assignedUser}=addTask
    const selectQuery=`INSERT INTO todoTask(task,priority,status,assignedUser) Values(
        `${task}`,
        `${priority}`,
        `${status}`,
        `${assignedUser}`
    );`;
    const dbResponse = await db.run(addTask);
    const taskId = dbResponse.lastID;
    response.send({ taskId: taskId }); 
})

app.put("/task/:taskId/",authenticateToken, async (request, response) => {
  let{username}=request
  const { taskId } = request.params;
  const taskDetails = request.body;
  const {
    task,priority,status,assignedUser
  } = taskDetails;
  const updateTaskQuery = `
    UPDATE
      todoTask
    SET
        task=`${task}`,
        priority= `${priority}`,
        status= `${status}`,
        assignedUser=`${assignedUser}`
    WHERE
      task_id = ${taskId};`;
  await db.run(updateTaskQuery);
  response.send("Task Updated Successfully");
});

app.get("/todo-tasks/",authenticateToken, async (request, response) => {
  const { priority,status,assignedUser } = request.params;
  const getTaskQuery = `
    SELECT
     *
    FROM
     todoTask
    WHERE
      status = ${status}; and priority=${priority} and assignedUser=${assignedUser}`;
  const task = await db.all(getTaskQuery);
  response.send(task);
});
app.get("/todo-tasks/",authenticateToken, async  (request, response) => {
  const { priority,status,assignedUser } = request.params;
  const getTaskQuery = `
    SELECT
     *
    FROM
     todoTask
    WHERE
      status = ${status} and priority=${priority};`;
  const task = await db.all(getTaskQuery);
  response.send(task);
});
app.get("/todo-tasks/",authenticateToken, async (request, response) => {
  const { priority,status,assignedUser } = request.params;
  const getTaskQuery = `
    SELECT
     *
    FROM
     todoTask
    WHERE
      status = ${status} and assignedUser=${assignedUser};`;
  const task = await db.all(getTaskQuery);
  response.send(task);
});
app.get("/todo-tasks/",authenticateToken, async (request, response) => {
  const { priority,status,assignedUser } = request.params;
  const getTaskQuery = `
    SELECT
     *
    FROM
     todoTask
    WHERE
      status = ${status};`;
  const task = await db.all(getTaskQuery);
  response.send(task);
});
app.get("/todo-tasks/",authenticateToken, async (request, response) => {
  const { priority,status,assignedUser } = request.params;
  const getTaskQuery = `
    SELECT
     *
    FROM
     todoTask
    WHERE
      priority=${priority};`;
  const task = await db.all(getTaskQuery);
  response.send(task);
});
app.get("/todo-tasks/",authenticateToken, async (request, response) => {
  const { priority,status,assignedUser } = request.params;
  const getTaskQuery = `
    SELECT
     *
    FROM
     todoTask
    WHERE
       assignedUser=${assignedUser}`;
  const task = await db.all(getTaskQuery);
  response.send(task);
});

app.delete("/deleteTodo/:TaskId/",authenticateToken, async (request, response) => {
  const { taskId } = request.params;
  const deleteTaskQuery = `
    DELETE FROM
      todoTask
    WHERE
      task_id = ${taskId};`;
  await db.run(deleteTaskQuery);
  response.send("Task Deleted Successfully");
});
