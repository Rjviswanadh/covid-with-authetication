const express = require("express");
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");
let path = require("path");
const bcrypt = require("bcrypt");
const dbPath = path.join(__dirname, "covid19IndiaPortal.db");
let db = null;
let path1 = 4010;

const jwt = require("jsonwebtoken");

const app = express();
app.use(express.json());
const getDataBase = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(path1, () => {
      console.log(`server running at ${path1}`);
    });
  } catch (e) {
    console.log("plz check what is wrong");
  }
};
getDataBase();

let middleWare = (request, response, next) => {
  let authorizationToken;
  const authent = request.headers["authorization"];
  if (authent !== undefined) {
    authorizationToken = authent.split(" ")[1];
  }
  if (authorizationToken === undefined) {
    response.status(401);
    response.send("invalid jws Token");
  } else {
    jwt.verify(authorizationToken, "MY_SECRET_TOKEN", (error, payload) => {
      if (error) {
        response.send("Invalid JWT Token");
      } else {
        request.username = payload.username;
        next();
      }
    });
  }
};

app.post("/login/", middleWare, async (request, response) => {
  const { username, password } = request.body;
  const user_details = `select * from user where username = "${username}"`;
  const list = await db.get(user_details);
  //console.log(list);
  if (list === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const userVerify = await bcrypt.compare(password, list.password);
    if (userVerify === true) {
      const payload = {
        username: username,
      };
      const jwtToken = jwt.sign(payload, "MY_SECRET_TOKEN");
      response.send({ jwtToken });
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

app.get("/states/", middleWare, async (request, response) => {
  const getStates = `select state_id as stateId,state_name as stateName,population from state`;
  const list = await db.all(getStates);
  response.send(list);
});

app.get("/states/:stateId", middleWare, async (request, response) => {
  const { stateId, stateName, population } = request.body;
  const getStateId = `select state_id as stateId,state_name as stateName,population from state where state_id = "${stateId}"`;
  const listSingle = await db.get(getStateId);
  response.send(listSingle);
});

app.post("/districts/", middleWare, async (request, response) => {
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const postItems = `insert into district (district_name,state_id,cases,cured,active,deaths) values ("${districtName}","${stateId}","${cases}","${cured}","${active}","${deaths}")`;
  const posted = await db.run(postItems);
  response.send("District Successfully Added");
});

app.get("/districts/:districtId", middleWare, async (request, response) => {
  const { districtId } = request.params;
  const getDisId = `select district_id as districtId,district_name as districtName,state_id as stateId,cases,cured,active,deaths from district where district_id = "${districtId}"`;
  const listSingleDis = await db.get(getDisId);
  response.send(listSingleDis);
});

app.delete("/districts/:districtId", middleWare, async (request, response) => {
  const { districtId } = request.params;
  const getDelId = `delete  from district where district_id = "${districtId}"`;
  const listSingleDel = await db.get(getDelId);
  response.send("District Removed");
});

app.put("/districts/:districtId", middleWare, async (request, response) => {
  const { districtId } = request.params;
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const putItem = `update district set district_name = "${districtName}",state_id = "${stateId}",cases = "${cases}",cured = "${cured}",active = "${active}",deaths = "${deaths}"`;
  const updatedItems = await db.run(putItem);
  response.send("District Details Updated");
});

module.exports = app;
