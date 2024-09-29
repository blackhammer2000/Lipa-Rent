const { sign } = require("jsonwebtoken");
require("dotenv").config();

const signAccessToken = (userData) => {
  return new Promise((resolve, reject) => {
    const token = sign(userData, process.env.MY_SECRET_KEY, {
      expiresIn: "2h",
      issuer: "liparent inc.",
      audience: `${userData}`,
    });

    if (!token) reject(token);
    resolve(token);
  });
};

module.exports = { signAccessToken };
