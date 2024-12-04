const { sign } = require("jsonwebtoken");
require("dotenv").config();

const signResetPasswordToken = (userData) => {
  return new Promise((resolve, reject) => {
    const token = sign(userData, process.env.RESET_SECRET_KEY, {
      expiresIn: "10min",
      issuer: "liparent inc.",
      audience: `${userData}`,
    });

    if (!token) reject(token);

    resolve(token);
  });
};

module.exports = { signResetPasswordToken };
