const { sign } = require("jsonwebtoken");
require("dotenv").config();

const signLogoutToken = (userData) => {
  return new Promise((resolve, reject) => {
    const token = sign(userData, process.env.LOGOUT_SECRET_KEY, {
      algorithm: process.env.TOKEN_HASHING_ALGO,
      expiresIn: "2min",
      issuer: "LipaRent Inc.",
      audience: `${userData}`,
    });

    if (!token) reject(token);

    resolve(token);
  });
};

module.exports = { signLogoutToken };
