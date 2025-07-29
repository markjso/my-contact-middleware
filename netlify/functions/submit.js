const fetch = require("node-fetch");

exports.handler = async (event) => {
  const {
    ZOHO_CLIENT_ID,
    ZOHO_CLIENT_SECRET,
    ZOHO_REFRESH_TOKEN,
    ZOHO_REDIRECT_URI,
  } = process.env;

  const formData = JSON.parse(event.body);

  // 1. Get access token from refresh token
  const tokenRes = await fetch("https://accounts.zoho.com/oauth/v2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: ZOHO_REFRESH_TOKEN,
      client_id: ZOHO_CLIENT_ID,
      client_secret: ZOHO_CLIENT_SECRET,
      redirect_uri: ZOHO_REDIRECT_URI,
      grant_type: "refresh_token",
    }),
  });

  const tokenData = await tokenRes.json();
  const accessToken = tokenData.access_token;

  // 2. Send data to Zoho CRM or Forms
  const zohoRes = await fetch("https://www.zohoapis.com/crm/v2/Contacts", {
    method: "POST",
    headers: {
      Authorization: `Zoho-oauthtoken ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      data: [
        {
          First_Name: formData.firstName,
          Last_Name: formData.lastName,
          Email: formData.email,
          Phone: formData.phone,
          City: formData.suburb,
          Description: formData.message,
          Lead_Source: formData.howFoundUs,
          Number_of_Employees: formData.guestCount,
          Custom_Date: formData.preferredDate,
        },
      ],
    }),
  });

  const zohoResult = await zohoRes.json();

  return {
    statusCode: 200,
    body: JSON.stringify({ message: "Data submitted!", zohoResult }),
  };
};
