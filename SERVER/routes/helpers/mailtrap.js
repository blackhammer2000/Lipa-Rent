require("dotenv").config();
const { MailtrapClient } = require("mailtrap");

async function sendEmail(to, subject, text) {
  const TOKEN = process.env.MAILTRAP_API_KEY;

  const client = new MailtrapClient({
    token: TOKEN,
    sandbox: true,
    testInboxId: 4857362,
  });

  const sender = {
    email: "info@liparent.com",
    name: "LIPA RENT",
  };

  try {
    const isEmailSent = await client.send({
      from: sender,
      to: [{ email: to }],
      subject: subject,
      text: text,
    });

    if (!isEmailSent) throw new Error(isEmailSent);

    return true;
  } catch (error) {
    if (error) {
      console.error("Error sending email:", error);
      return false;
    }
  }
}

module.exports = { sendEmail };
