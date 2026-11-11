const { sign, verify } = require("jsonwebtoken");
require("dotenv").config();

const signRefreshToken = (userData) => {
  return new Promise((resolve, reject) => {
    const token = sign(userData, process.env.REFRESH_SECRET_KEY, {
      algorithm: process.env.TOKEN_HASHING_ALGO,
      expiresIn: "7d",
      issuer: "LipaRent Inc.",
      audience: `${userData.id}`,
    });

    if (!token) reject(token);
    resolve(token);
  });
};

const verifyRefreshToken = (token) => {
  return new Promise((resolve, reject) => {
    try {
      const decoded = verify(token, process.env.REFRESH_SECRET_KEY, {
        algorithms: [process.env.TOKEN_HASHING_ALGO],
        issuer: "LipaRent Inc.",
      });
      resolve(decoded);
    } catch (err) {
      reject(err);
    }
  });
};

module.exports = { signRefreshToken, verifyRefreshToken };