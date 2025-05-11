const { sign } = require("jsonwebtoken");
require("dotenv").config();

const signAccessToken = (userData) => {
  return new Promise((resolve, reject) => {
    const token = sign(userData, process.env.MY_SECRET_KEY, {
      expiresIn: "1m",
      issuer: "liparent inc.",
      audience: `${userData.id}`,
    });

    if (!token) reject(token);
    resolve(token);
  });
};

module.exports = { signAccessToken };
