const { sign } = require("jsonwebtoken");
require("dotenv").config();

const signForgotPasswordToken = (userData) => {
  return new Promise((resolve, reject) => {
    const token = sign(userData, process.env.FORGOT_SECRET_KEY, {
      expiresIn: "5min",
      issuer: "LipaRent Inc.",
      audience: `${userData}`,
    });

    if (!token) reject(token);

    resolve(token);
  });
};

module.exports = { signForgotPasswordToken };
