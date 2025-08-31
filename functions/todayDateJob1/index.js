"use strict";

const catalyst = require("zcatalyst-sdk-node");

/**
 * Catalyst Job Function
 * @param {import("./types/job").JobRequest} jobRequest 
 * @param {import("./types/job").Context} context 
 */
module.exports = async (jobRequest, context) => {
    console.log("Hello from Catalyst Job");

    try {
        // Initialise Catalyst in admin scope (jobs run as admin)
        const app = catalyst.initialize(context, { scope: "admin" });
        const datastore = app.datastore();

        // Get current IST time
        const now = new Date();
        const istTime = now.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
        console.log("Current IST Time:", istTime);

        // Get hour in IST
        const hourIST = parseInt(
            now.toLocaleString("en-IN", { timeZone: "Asia/Kolkata", hour: "2-digit", hour12: false })
        );

        // Decide greeting text based on time
        let greetingText = "";
        if (hourIST >= 5 && hourIST < 12) {
            greetingText = "Good Morning";
        } else if (hourIST >= 12 && hourIST < 17) {
            greetingText = "Good Afternoon";
        } else if (hourIST >= 17 && hourIST < 21) {
            greetingText = "Good Evening";
        } else {
            greetingText = "Good Night";
        }

        // Update row in "Greetings" table
        const rowData = { 
            ROWID: "17880000000018279", // Replace with your actual ROWID
            text: greetingText, 
            dateShow: istTime 
        };

        const row = await datastore.table("Greetings").updateRow(rowData);
        console.log("Row updated:", row);

        // End job with success
        context.closeWithSuccess();
    } catch (error) {
        console.error("Error in job function:", error);
        context.closeWithFailure();
    }
};
