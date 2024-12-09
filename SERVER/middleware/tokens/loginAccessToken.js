const { sign } = require("jsonwebtoken");
require("dotenv").config();

const signLoginAccessToken = (userData) => {
  return new Promise((resolve, reject) => {
    const token = sign(userData, process.env.LOGIN_SECRET_KEY, {
      expiresIn: "5min",
      issuer: "liparent inc.",
      audience: `${userData}`,
    });

    if (!token) reject(token);

    resolve(token);
  });
};

module.exports = { signLoginAccessToken };
