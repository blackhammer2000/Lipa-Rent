const { sign } = require("jsonwebtoken");
require("dotenv").config();

const signLogoutToken = (userData) => {
  return new Promise((resolve, reject) => {
    const token = sign(userData, process.env.LOGOUT_SECRET_KEY, {
      expiresIn: "2min",
      issuer: "liparent inc.",
      audience: `${userData}`,
    });

    if (!token) reject(token);

    resolve(token);
  });
};

module.exports = { signLogoutToken };
