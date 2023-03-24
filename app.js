const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "covid19India.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3004, () => {
      console.log("Server Running at http://localhost:3004/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

//API 1
app.get("/states/", async (request, response) => {
  const getStates = `SELECT * FROM state;`;

  const allStates = await db.all(getStates);
  const statesToObj = (st) => {
    return {
      stateId: st.state_id,
      stateName: st.state_name,
      population: st.population,
    };
  };

  response.send(allStates.map((eachState) => statesToObj(eachState)));
});

//API 2
app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getStateByIdQuery = `
    SELECT * FROM state
    WHERE state_id = ${stateId};
    `;

  const resultStateId = await db.get(getStateByIdQuery);

  const stateToObj = (sta) => {
    return {
      stateId: sta.state_id,
      stateName: sta.state_name,
      population: sta.population,
    };
  };

  response.send(stateToObj(resultStateId));
});

//API 3
app.post("/districts/", async (request, response) => {
  const requestDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = requestDetails;

  const createDistrictQuery = `
  INSERT INTO
    district (district_name, state_id, cases, cured, active, deaths)
  VALUES
    ('${districtName}',${stateId},${cases},${cured},${active},${deaths});
  `;

  const createDistrictResp = await db.run(createDistrictQuery);
  const districtId = createDistrictResp.lastID;

  response.send("District Successfully Added");
});

//API 4
app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictByIdQuery = `
    SELECT * FROM district
    WHERE district_id = ${districtId};
    `;

  const getDistrictResponse = await db.get(getDistrictByIdQuery);

  const districtToObj = (dis) => {
    return {
      districtId: dis.district_id,
      districtName: dis.district_name,
      stateId: dis.state_id,
      cases: dis.cases,
      cured: dis.cured,
      active: dis.active,
      deaths: dis.deaths,
    };
  };

  response.send(districtToObj(getDistrictResponse));
});

//API 5
app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;

  const deleteDistrict = `
    DELETE FROM district
    WHERE district_id = ${districtId};
    `;

  await db.run(deleteDistrict);
  response.send("District Removed");
});

//API 6
app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const districtDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;

  const updateDistrict = `
  UPDATE
    district
  SET 
    district_name = '${districtName}',
    state_id = ${stateId},
    cases = ${cases},
    cured = ${cured},
    active = ${active},
    deaths = ${deaths}
  WHERE district_id = ${districtId};
  `;

  await db.run(updateDistrict);
  response.send("District Details Updated");
});

//API 7
app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;

  const totalCasesQuery = `
  SELECT SUM(cases),SUM(cured),SUM(active),SUM(deaths)
  FROM district
  WHERE state_id = ${stateId};
  `;

  const stats = await db.get(totalCasesQuery);

  response.send({
    totalCases: stats["SUM(cases)"],
    totalCured: stats["SUM(cured)"],
    totalActive: stats["SUM(active)"],
    totalDeaths: stats["SUM(deaths)"],
  });
});

//API 8
app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;

  const getDistrictDetails = `
    SELECT * FROM district
    WHERE district_id = ${districtId};
    `;

  const stateDetails = await db.get(getDistrictDetails);

  const getStateName = `
  SELECT state_name FROM state
  WHERE state_id = ${stateDetails.state_id};
  `;

  const details = await db.get(getStateName);

  response.send({
    stateName: details.state_name,
  });
});
