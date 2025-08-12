"use strict"

const express = require('express');
const catalyst = require('zcatalyst-sdk-node');

const app = express();
app.use(express.json());


app.post("/cache", (req, res) => {

    const catalystApp = catalyst.initialize(req);

	const requestQuery = req.query;

	//Get Segment instance with segment ID (If no ID is given, Default segment is used)
	let segment = catalystApp.cache().segment();
	//Insert Cache using put by passing the key-value pair.
	let cachePromise = segment.put(requestQuery.name, requestQuery.value, requestQuery.expiry);

	cachePromise
		.then((cache) => {
			console.log("\nInserted Cache : " + JSON.stringify(cache));
			res.status(200).json(cache);
		})
		.catch((err) => {
			console.log(err);
			res.status(500).send(err);
		});

});

// Helper to read the raw request body
function getRequestBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", chunk => (body += chunk));
    req.on("end", () => resolve(body));
    req.on("error", err => reject(err));
  });
}

module.exports = async (req, res) => {
  // CORS & preflight
  res.setHeader("Access-Control-Allow-Origin",  "*");
  res.setHeader("Access-Control-Allow-Methods","POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers","Content-Type");
  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    return res.end();
  }
  if (req.method !== "POST") {
    res.statusCode = 405;
    res.setHeader("Content-Type","application/json");
    return res.end(JSON.stringify({ success:false, error:"Method Not Allowed" }));
  }

  try {
    // 1) Read & parse the incoming JSON
    const rawBody = await getRequestBody(req);
    const rowData = JSON.parse(rawBody);
    const { FirstName, LastName, EmailId, LoanAmount, InterestRate } = rowData;

    // 2) Initialize Catalyst and insert into Datastore
    const catalystApp = catalyst.initialize(req);
    const table = catalystApp.datastore().table("userDetails");
    const allRows = await table.getAllRows();
    const existingRow = allRows.find(row =>
      row.FirstName === FirstName &&
      row.LastName === LastName &&
      row.EmailId === EmailId
    );

    if (existingRow) {
      const updatedRow = {
        ROWID: existingRow.ROWID,
        LoanAmount,
        InterestRate
      };
      const result = await table.updateRow(updatedRow);

    // 3) Return success JSON
    res.statusCode = 200;
    res.setHeader("Content-Type","application/json");
    return res.end(JSON.stringify({ success:true, action: "updated", data: result }));
  } else {
      // Step 4: Insert new row
      const inserted = await table.insertRow(rowData);
      res.statusCode = 200;
      return res.end(JSON.stringify({ success: true, action: "inserted", data: inserted }));
    }
 } catch (err) {
    console.error("Function error:", err);
    res.statusCode = 500;
    res.setHeader("Content-Type","application/json");
    return res.end(JSON.stringify({ success:false, error: err.message }));
  }
};