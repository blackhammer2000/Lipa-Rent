const { sign } = require("jsonwebtoken");
require("dotenv").config();

const signAdminAccessToken = (adminData) => {
  return new Promise((resolve, reject) => {
    const token = sign(adminData, process.env.MY_SECRET_KEY_ADMIN, {
      expiresIn: "2h",
      issuer: "LipaRent Inc.",
      audience: `${adminData}`,
    });

    if (!token) reject(token);
    resolve(token);
  });
};

module.exports = { signAdminAccessToken };
