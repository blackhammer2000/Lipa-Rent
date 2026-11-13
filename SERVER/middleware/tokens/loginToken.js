const { sign } = require("jsonwebtoken");
require("dotenv").config();

const signLoginToken = (userData) => {
  return new Promise((resolve, reject) => {
    const token = sign(userData, process.env.LOGIN_SECRET_KEY, {
      algorithm: process.env.TOKEN_HASHING_ALGO,
      expiresIn: "5min",
      issuer: "LipaRent Inc.",
      audience: `${userData.id}`,
    });

    if (!token) reject(token);

    resolve(token);
  });
};

module.exports = { signLoginToken };
