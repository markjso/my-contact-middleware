const fetch = require("node-fetch");
const nodemailer = require("nodemailer");

exports.handler = async (event) => {
  if (!event.body) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "No data provided in body" }),
    };
  }

  let formData;
  try {
    formData = JSON.parse(event.body);
  } catch (err) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Invalid JSON body" }),
    };
  }

  // Destructure environment variables
  const {
    ZOHO_CLIENT_ID,
    ZOHO_CLIENT_SECRET,
    ZOHO_REFRESH_TOKEN,
    ZOHO_REDIRECT_URI,
    SMTP_USER,
    SMTP_PASS,
    NOTIFY_EMAIL,
  } = process.env;

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

  if (!tokenData.access_token) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to get access token", tokenData }),
    };
  }

  const accessToken = tokenData.access_token;

  // 2. Send data to Zoho CRM
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
          Type_of_Event1: formData.eventType,
          Email: formData.email,
          Phone: formData.phone,
          Venue: formData.suburb,
          Description: formData.message,
          Lead_Source: formData.referral,
          Number_of_guests: formData.guestCount,
          Date_of_Event: formData.preferredDate,
        },
      ],
    }),
  });

  const zohoResult = await zohoRes.json();

  const transporter = nodemailer.createTransport({
    host: "smtp.zoho.com",
    port: 465,
    secure: true,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });

  await transporter.sendMail({
    from: SMTP_USER,
    to: NOTIFY_EMAIL,
    subject: "Request a Quote",
    text: `
New Contact Submission:
Name: ${formData.firstName} ${formData.lastName}
Email: ${formData.email}
Phone: ${formData.phone}
Suburb: ${formData.suburb}
Preferred Date: ${formData.preferredDate}
Guests: ${formData.guestCount}
Referral: ${formData.referral}
Message: ${formData.message}
    `,
  });

  return {
    statusCode: 200,
    body: JSON.stringify({ message: "Data submitted to Zoho!", zohoResult }),
  };
};
