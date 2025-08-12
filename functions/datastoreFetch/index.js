'use strict';
const catalyst = require('zcatalyst-sdk-node');

module.exports = async (req, res) => {
  const app = catalyst.initialize(req);
  const datastore = app.datastore();

  try {
    const table = datastore.table('userDetails');
    const rows = await table.getAllRows();
    console.log("Loan Details:", rows);

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ userDetailsTable: rows }));

  } catch (error) {
    console.error(error);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: "Failed to fetch loan details" }));
  }
};
