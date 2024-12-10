const { sign } = require("jsonwebtoken");
require("dotenv").config();

const signLoginToken = (userData) => {
  return new Promise((resolve, reject) => {
    console.log(userData);

    const token = sign(userData, process.env.LOGIN_SECRET_KEY, {
      expiresIn: "5min",
      issuer: "liparent inc.",
      audience: `${userData.id}`,
    });

    if (!token) reject(token);

    resolve(token);
  });
};

module.exports = { signLoginToken };
