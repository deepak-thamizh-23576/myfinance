const catalyst = require("zcatalyst-sdk-node");

module.exports = async (event, context) => {
  try {
    const catalystApp = catalyst.initialize(context);

    const CLIENT_ID = "1000.B3MIW7XK0SMA0BKVTPMQNYD3XYPBKQ";
    const CLIENT_SECRET = "40862f80f82f26f072403c111745276791c2a74354";
    const REFRESH_TOKEN = "1000.09b2067326a16e1e3a0c6b86208737c7.679f6dd88b208ec4d7222a7d9411685a";

    // --- STEP 1: Get new Access Token ---
    const tokenUrl = `https://accounts.zoho.in/oauth/v2/token?refresh_token=${REFRESH_TOKEN}&client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}&grant_type=refresh_token`;
    const tokenResponse = await fetch(tokenUrl, { method: "POST" });
    const tokenData = await tokenResponse.json();

    if (!tokenData.access_token) {
      console.error("Failed to refresh token:", tokenData);
      return context.closeWithFailure();   // ❌ Fail early
    }

    const accessToken = tokenData.access_token;

    // --- STEP 2: Extract User Data ---
    const RAW_DATA = event.getRawData();
    console.log("RAW DATA:", JSON.stringify(RAW_DATA));

    const user = RAW_DATA.events[0]?.data?.user_details;
    if (!user) {
      console.error("No user details in payload");
      return context.closeWithFailure();   // ❌ Fail if no user details
    }

    const leadData = {
      data: [
        {
          Last_Name: user.last_name || "Unknown",
          First_Name: user.first_name || "",
          Email: user.email_id,
          Lead_Source: "Catalyst Signup",
          Description: `User ZUID: ${user.zuid}, Role: ${user.role_details?.role_name}`
        }
      ]
    };

    // --- STEP 3: Push Lead to CRM ---
    const crmUrl = "https://www.zohoapis.in/crm/v2/Leads";
    const response = await fetch(crmUrl, {
      method: "POST",
      headers: {
        "Authorization": `Zoho-oauthtoken ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(leadData)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("CRM Error:", errorText);
      return context.closeWithFailure();   // ❌ Fail if CRM rejects
    }

    const result = await response.json();
    console.log("CRM Response:", result);

    // ✅ If everything worked fine, mark success
    context.closeWithSuccess();
  } catch (err) {
    console.error("Error processing event:", err.message);
    context.closeWithFailure();  // ❌ Any unexpected error
  }
};
