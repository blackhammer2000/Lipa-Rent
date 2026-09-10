const { sign } = require("jsonwebtoken");
require("dotenv").config();

const signSignUpToken = (userData) => {
  return new Promise((resolve, reject) => {
    const token = sign(userData, process.env.SIGNUP_SECRET_KEY, {
      algorithm: process.env.TOKEN_HASHING_ALGO,
      expiresIn: "10min",
      issuer: "LipaRent Inc.",
      audience: `${userData.id}`,
    });

    if (!token) reject(token);

    resolve(token);
  });
};

module.exports = { signSignUpToken };
