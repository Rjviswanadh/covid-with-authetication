const express = require("express");
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");
let path = require("path");
const dbPath = path.join(__dirname, "covid19IndiaPortal.db");
let db = null;
let path1 = 4010;
const bcrypt = require("bcrypt");
const app = express();
app.use(express.json());
const jwt = require("jsonwebtoken");
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

const convertInto = (obj) => {
  return {
    stateId: obj.state_id,
    stateName: obj.state_name,
    population: obj.population,
  };
};

convertDistrict = (obj) => {
  return {
    districtId: obj.districtId,
    districtName: obj.districtName,
    stateId: state_id,
    cases: obj.cases,
    cured: obj.cured,
    active: obj.active,
    deaths: object.deaths,
  };
};

app.post("/login/", async (request, response) => {
  const { username, password } = request.body;
  const getUser = `select * from user where username = "${username}"`;
  const getResult = await db.get(getUser);
  //console.log(getResult);
  if (getResult === undefined) {
    response.send("Invalid user");
    response.status(401);
  } else {
    const convertPassword = await bcrypt.compare(password, getResult.password);
    if (convertPassword === true) {
      const payload = {
        username: username,
      };
      const jwtToken = jwt.sign(payload, "my jwt_token");
      response.send(jwtToken);
    } else {
      response.send("Invalid password");
      response.status(401);
    }
  }
});

//middleware
let middleWare = (request, response, next) => {
  let authorizationToken;
  const authent = request.headers["authorization"];
  //console.log(authent);
  if (authent !== undefined) {
    authorizationToken = authent.split(" ")[1];
    jwt.verify(authorizationToken, "my jwt_token", (error, payload) => {
      if (error) {
        response.send("Invalid JWT Token");
        response.status(401);
      } else {
        request.username = payload.username;
        next();
      }
    });
  } else {
    response.send("Invalid JWT Token");
    response.status(401);
  }
};

//all apis 2nd onwards
app.get("/states/", middleWare, async (request, response) => {
  const getStates = `select * from state`;
  const list = await db.all(getStates);
  response.send(list.map((eachItem) => convertInto(eachItem)));
});

app.get("/states/:stateId/", middleWare, async (request, response) => {
  const { stateId } = request.params;
  const getStateId = `select * from state where state_id = "${stateId}"`;
  const listSingle = await db.get(getStateId);
  response.send(convertInto(listSingle));
});

app.post("/districts/", middleWare, async (request, response) => {
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const postItems = `insert into district (district_name,state_id,cases,cured,active,deaths) values ("${districtName}","${stateId}","${cases}","${cured}","${active}","${deaths}")`;
  const posted = await db.run(postItems);
  response.send("District Successfully Added");
});

app.get("/districts/:districtId/", middleWare, async (request, response) => {
  const { districtId } = request.params;
  const getDisId = `select * from district where district_id = "${districtId}"`;
  const listSingleDis = await db.get(getDisId);
  response.send(listSingleDis.map((each) => convertDistrict(each)));
});

app.delete("/districts/:districtId/", middleWare, async (request, response) => {
  const { districtId } = request.params;
  const getDelId = `delete  from district where district_id = "${districtId}"`;
  const listSingleDel = await db.get(getDelId);
  response.send("District Removed");
});

app.put("/districts/:districtId/", middleWare, async (request, response) => {
  const { districtId } = request.params;
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const putItem = `update district set district_name = "${districtName}",state_id = "${stateId}",cases = "${cases}",cured = "${cured}",active = "${active}",deaths = "${deaths}"`;
  const updatedItems = await db.run(putItem);
  response.send("District Details Updated");
});
app.get("/states/:stateId/stats/", middleWare, async (request, response) => {
  const { stateId } = request.params;
  const getStat = `select sum(cases) as totalCases,sum(cured) as totalCured,sum(active) as totalActive,sum(deaths) as totalDeaths from district`;
  const getResult = await db.get(getStat);
  response.send(getResult);
});

module.exports = app;
