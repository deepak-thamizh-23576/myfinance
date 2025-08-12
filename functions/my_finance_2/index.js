'use strict';

var catalyst = require('zcatalyst-sdk-node');

const { IncomingMessage, ServerResponse } = require("http");

/**
 * 
 * @param {IncomingMessage} req 
 * @param {ServerResponse} res 
 */
module.exports = async (req, res) => {
	var url = req.url;
	var app = catalyst.initialize(req);
	let userManagement = app.userManagement();
	//Get a datastore instance 
	let datastore = app.datastore();

	try {
		const allUserDetails = await userManagement.getAllUsers();
		console.log(allUserDetails);

		const table = datastore.table('userDetails');
		const rows = await table.getAllRows(); 
		console.log(rows);

		res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
		users: allUserDetails,
		userDetailsTable: rows
		}));
	} catch (error) {
		console.error(error);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: "Failed to fetch users" }));
	}

	// ✅ Fetch all orgs
	userManagement.getAllOrgs()
		.then(orgsResponse => {
			console.log("Organizations:");
			console.log(JSON.stringify(orgsResponse, null, 2));
		})
		.catch(error => {
			console.error("Error fetching orgs:", error);
		});

	switch (url) {
		case '/':
			res.writeHead(200, { 'Content-Type': 'text/html' });
			res.write('<h1>Hello from index.js<h1>');
			break;
		default:
			res.writeHead(404);
			res.write('You might find the page you are looking for at "/" path');
			break;
	}
	res.end();
};