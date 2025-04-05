const { sign } = require("jsonwebtoken");
require("dotenv").config();

const signSignUpToken = (userData) => {
  return new Promise((resolve, reject) => {
    const token = sign(userData, process.env.SIGNUP_SECRET_KEY, {
      expiresIn: "5min",
      issuer: "liparent inc.",
      audience: `${userData.id}`,
    });

    if (!token) reject(token);

    resolve(token);
  });
};

module.exports = { signSignUpToken };
