require("dotenv").config();

const express = require("express");
const app = express();
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const mongoSanitize = require("express-mongo-sanitize");
const cookieParser = require("cookie-parser");
const CSRF = require("csrf");
const PORT = process.env.PORT || 8080;
const origin = process.env.ORIGIN;
const csrfSecret = process.env.CSRF_SECRET || "default-csrf-secret-change-in-production";
const tokens = new CSRF();

const { connect } = require("mongoose");

const userRoutes = require("./routes/users/routes/routes");

// Request body size limits (S9) — prevent DoS via huge payloads
app.use(express.json({ limit: "10kb" }));
app.use(cookieParser());

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
        scriptSrc: ["'self'"],
        styleSrc: ["'self'"],
        imgSrc: ["'self'", "data:"],
        connectSrc: origin
          ? ["'self'", origin]
          : ["'self'"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        objectSrc: ["'none'"],
        frameSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
      },
    },
  }),
);

app.use(
  cors({
    origin,
    credentials: true,
  }),
);

// --- MongoDB injection sanitization ---
app.use(mongoSanitize());

// --- CSRF protection ---
app.use((req, res, next) => {
  const stateChanging = ["POST", "PATCH", "PUT", "DELETE"].includes(req.method);

  if (stateChanging) {
    const csrfToken = req.headers["x-csrf-token"];
    if (!csrfToken || !tokens.verify(csrfSecret, csrfToken)) {
      return res.status(403).json({ error: "Invalid or missing CSRF token" });
    }
  }

  // Issue a fresh CSRF token for the client to use on the next state-changing request
  const token = tokens.create(csrfSecret);
  res.setHeader("X-CSRF-Token", token);

  next();
});

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
