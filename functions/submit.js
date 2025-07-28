const fetch = require('node-fetch');

exports.handler = async (event) => {
  const {
    ZOHO_CLIENT_ID,
    ZOHO_CLIENT_SECRET,
    ZOHO_REFRESH_TOKEN,
    ZOHO_REDIRECT_URI,
  } = process.env;

async function getAccessToken() {
  const response = await fetch('https://accounts.zoho.com/oauth/v2/token', {
    method: 'POST',
    body: new URLSearchParams({
      refresh_token: ZOHO_REFRESH_TOKEN,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      grant_type: 'refresh_token',
    }),
  });

  const data = await response.json();
  return data.access_token;
}

exports.handler = async function (event, context) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  }

  try {
    const formData = JSON.parse(event.body);
    const {
      firstName,
      lastName,
      eventType,
      email,
      phone,
      suburb,
      preferredDate,
      guestCount,
      message,
      referral
    } = formData;

    const accessToken = await getAccessToken();

    const leadData = {
      data: [
        {
          First_Name: firstName,
          Last_Name: lastName,
          Email: email,
          Phone: phone,
          Company: 'Web Inquiry',
          Description: `
Event Type: ${eventType}
Suburb: ${suburb}
Preferred Date: ${preferredDate}
Guest Count: ${guestCount}
Message: ${message}
Referral: ${referral}
          `.trim()
        }
      ]
    };

    const zohoRes = await fetch('https://www.zohoapis.com/crm/v2/Leads', {
      method: 'POST',
      headers: {
        Authorization: `Zoho-oauthtoken ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(leadData),
    });

    const zohoResult = await zohoRes.json();

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, zohoResult }),
    };
  } catch (error) {
    console.error('Middleware error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Server error' }),
    };
  }
};
