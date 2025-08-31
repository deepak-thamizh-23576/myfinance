const catalyst = require("zcatalyst-sdk-node");

module.exports = async (event, context) => {
  try {
    const catalystApp = catalyst.initialize(context);

    const CLIENT_ID = "1000.D5QRC43ASKHQTG72E07VYU1U3DF4XP";
    const CLIENT_SECRET = "4ee855cb93a791853740d3f71e3c9e83801f9a47a4";
    const REFRESH_TOKEN = "1000.66e965c8efde9e106f824c79260f0f8d.ad4bc7f435a34866191d6658898ed714";

    // --- STEP 1: Get new Access Token ---
    const tokenUrl = `https://accounts.zoho.in/oauth/v2/token?refresh_token=${REFRESH_TOKEN}&client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}&grant_type=refresh_token`;
    const tokenResponse = await fetch(tokenUrl, { method: "POST" });
    const tokenData = await tokenResponse.json();

    if (!tokenData.access_token) {
      console.error("Failed to refresh token:", tokenData);
      return context.closeWithFailure();
    }

    const accessToken = tokenData.access_token;

    // --- STEP 2: Extract Event Data ---
    const RAW_DATA = event.getRawData();
    console.log("RAW DATA:", JSON.stringify(RAW_DATA));

    const user = RAW_DATA.events[0]?.data;
    if (!user) {
      console.error("No user details in payload");
      return context.closeWithFailure();
    }

    const email = user.EmailId;
    const firstName = user.FirstName || "";
    const lastName = user.LastName || "Unknown";
	const loanAmount = user.LoanAmount || "Unable to fetch Loan Amount"; 
	const interestRate = user.InterestRate || "Unable to fetch Interest Rate"; 
	const applicationLink = user.ApplicationLink || "Unable to fetch File Link"; 

    // --- STEP 3: Search Lead in CRM by Email ---
    const searchUrl = `https://www.zohoapis.in/crm/v2/Leads/search?email=${email}`;
    const searchResponse = await fetch(searchUrl, {
      method: "GET",
      headers: {
        "Authorization": `Zoho-oauthtoken ${accessToken}`
      }
    });

    const searchResult = await searchResponse.json();
    console.log("CRM Search Result:", searchResult);

    if (!searchResult.data || searchResult.data.length === 0) {
      console.error(`Lead not found for Email: ${email}`);
      return context.closeWithFailure();
    }

    const leadId = searchResult.data[0].id; // Get CRM Lead ID

    // --- STEP 4: Update Lead with Loan Details ---
    const updateData = {
      data: [
        {
          id: leadId,
          First_Name: firstName,
          Last_Name: lastName,
          Email: email,
          Phone: loanAmount,
          Mobile: interestRate,
          Description: applicationLink,
          //Description: `Loan Application Updated via Catalyst. ROWID: ${user.ROWID}`
        }
      ]
    };

    const updateUrl = "https://www.zohoapis.in/crm/v2/Leads";
    const updateResponse = await fetch(updateUrl, {
      method: "PUT",
      headers: {
        "Authorization": `Zoho-oauthtoken ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(updateData)
    });

    const updateResult = await updateResponse.json();
    if (updateResult.data && updateResult.data[0].status === "error") {
		console.error("CRM Update Failed!");
		console.error("Error Code:", updateResult.data[0].code);
		console.error("Error Message:", updateResult.data[0].message);
		console.error("Error Details:", JSON.stringify(updateResult.data[0].details, null, 2));
		} else {
		console.log("CRM Update Response:", updateResult);
		}


    context.closeWithSuccess();
  } catch (err) {
    console.error("Error processing event:", err.message);
    context.closeWithFailure();
  }
};
