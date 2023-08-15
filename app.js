const express = require("express");
const app = express();
const path = require("path");
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");
app.use(express.json());
const dbPath = path.join(__dirname, "covid19India.db");
let db = null;

const objectSnakeAndCamel = (newObject) => {
  return {
    stateId: newObject.state_id,
    stateName: newObject.state_name,
    population: newObject.population,
  };
};
const districtSnakeToCamel = (newObject) => {
  return {
    districtId: newObject.district_id,
    districtName: newObject.district_name,
    stateId: newObject.state_id,
    cases: newObject.cases,
    cured: newObject.cured,
    active: newObject.active,
    deaths: newObject.deaths,
  };
};

const reportSnakeToCamel = (newObject) => {
  return {
    totalCases: newObject.cases,
    totalCured: newObject.cured,
    totalActive: newObject.active,
    totalDeaths: newObject.deaths,
  };
};

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log(`Server Is Running`);
    });
  } catch (error) {
    console.log(`error ${error.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

app.get("/states/", async (req, res) => {
  const allStatesList = `
    SELECT *
    FROM state
    ORDER BY state_id;`;
  const stateList = await db.all(allStatesList);
  const stateResult = stateList.map((eachObject) => {
    return objectSnakeAndCamel(eachObject);
  });
  res.send(stateResult);
});

app.get("/states/:stateId/", async (req, res) => {
  const { stateId } = req.params;
  const getState = `
    SELECT *
    FROM state
    WHERE state_id=${stateId};`;
  const newState = await db.get(getState);
  const stateResult = objectSnakeAndCamel(newState);
  res.send(stateResult);
});

app.post("/districts/", async (req, res) => {
  const createDistrict = req.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = createDistrict;
  const newDistrict = `
    INSERT INTO
    district(district_name,state_id,cases,cured,active,deaths)
    VALUES
    ('${districtName}',
    ${stateId},
    ${cases},
    ${cured},
    ${cured},
    ${active},
    ${deaths}
    );`;
  const addDistrict = await db.run(newDistrict);
  const districtId = addDistrict.lastId;
  res.send("District Successfully Added");
});

app.get("/districts/:districtId/", async (req, res) => {
  const { districtId } = req.params;
  const getDistrict = `
    SELECT *
    FROM district
    WHERE district_id= ${districtId};`;
  const newDistrict = await db.get(getDistrict);
  const directResult = districtSnakeToCamel(newDistrict);
  res.send(directResult);
});

app.delete("/districts/:districtId/", async (req, res) => {
  const { districtId } = req.params;
  const deleteDistrict = `
    DELETE 
    FROM district 
    WHERE district_id =${districtId};`;
  await db.run(deleteDistrict);
  res.send("District Removed");
});

app.put("/districts/:districtId/", async(req,res)=>{
    cost {districtId}=req.params;
    const districtDetails=req.body;
    const {
        districtName,
        stateId,
        cases,
        cured,
        active,
        deaths,
    }= districtDetails;
    const updateDistrict=`
    UPDATE 
    district 
    SET 
    district_name='${districtName}',
    state_id=${stateId},
    cases=${cases},
    cured=${cured},
    active= ${active},
    deaths=${deaths}
    WHERE district_id= ${districtId};`;
    await db.run(updateDistrict);
    res.send("District Details Updated");
});

app.get("/states/:stateId/stats/", async(req,res)=>{
    const {stateId}=req.params;
    const getStateReport= `
    SELECT SUM(cases) AS cases,
    SUM(cured) AS cured,
    SUM(active) AS active,
    SUM(deaths) AS deaths
    FROM district
    WHERE state_id= ${stateId};`;
    const stateReport=await db.get(getStateReport);
    const resultReport= reportSnakeToCamel(stateReport);
    res.send(resultReport);
});
app.get("/districts/:districtId/details/", async (req,res)=>{
    const {districtId}=req.params;
    const stateDetails=`
    SELECT state_name
    FROM state JOIN district
    ON state.state_id=district.state_id
    WHERE district.district_id=${districtId};`;
    const stateName= await db.get(stateDetails);
    response.send({stateName:stateName.state_name}); 
});
module.exports=app;
