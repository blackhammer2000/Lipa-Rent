require("dotenv").config();

const express = require("express");
const app = express();
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const PORT = process.env.PORT || 8080;
const origin = process.env.ORIGIN;

const { connect } = require("mongoose");

const userRoutes = require("./routes/users/routes/routes");

app.use(express.json());

// --- Global rate limiter (all API routes) ---
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later." },
});
app.use(globalLimiter);

// --- Stricter rate limiter for auth endpoints ---
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 auth requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many authentication attempts, please try again later." },
});

app.use(
  helmet({
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: origin ? { allowOrigins: [origin] } : false,
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        connectSrc: origin
          ? ["'self'", origin]
          : ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:"],
      },
    },
  }),
);

app.use(
  cors({
    origin,
  }),
);

app.use(userRoutes);

app.listen(PORT, () => {
  console.log(`server running on PORT ${PORT}.`);
});

(async function () {
  try {
    const connection = await connect(process.env.DB_CONNECTION);

    if (connection) console.log("connected to database.");
  } catch (error) {
    if (error) console.error(`Error connecting to database: ${error.message}`);
  }
})();
