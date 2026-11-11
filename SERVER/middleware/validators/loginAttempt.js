const { LoginAttempt } = require("../models/LoginAttempt");

// Account lockout configuration
const MAX_FAILED_ATTEMPTS = 5; // lock after 5 failures
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // lock for 15 minutes

const getClientIp = (req) => {
  return (
    req.headers["x-forwarded-for"] ||
    req.socket.remoteAddress ||
    req.ip ||
    "unknown"
  );
};

const loginAttemptMiddleware = async (req, res, next) => {
  try {
    const { email } = req.body;
    const ip = getClientIp(req);
    const now = new Date();

    // Check email-based lockout
    if (email) {
      const emailAttempt = await LoginAttempt.findOne({
        identifier: email.toLowerCase(),
        type: "email",
      });

      if (
        emailAttempt &&
        emailAttempt.lockUntil &&
        emailAttempt.lockUntil > now
      ) {
        return res.status(423).json({
          error: `Account temporarily locked. Too many failed attempts. Try again after ${emailAttempt.lockUntil.toISOString()}.`,
          response_status: "danger",
        });
      }
    }

    // Check IP-based lockout
    const ipAttempt = await LoginAttempt.findOne({
      identifier: ip,
      type: "ip",
    });

    if (ipAttempt && ipAttempt.lockUntil && ipAttempt.lockUntil > now) {
      return res.status(423).json({
        error: `Too many failed attempts from this IP. Try again after ${ipAttempt.lockUntil.toISOString()}.`,
        response_status: "danger",
      });
    }

    // Attach attempt docs to request for use after login result
    req.loginAttemptEmailDoc = emailAttempt || null;
    req.loginAttemptIpDoc = ipAttempt || null;
    req.clientIp = ip;

    next();
  } catch (err) {
    res.status(500).json({ error: err.message, response_status: "danger" });
  }
};

const recordFailedAttempt = async (req) => {
  const { email } = req.body;
  const ip = req.clientIp || getClientIp(req);
  const now = new Date();
  const lockUntil = new Date(now.getTime() + LOCKOUT_DURATION_MS);

  // Record email-based failure
  if (email) {
    if (req.loginAttemptEmailDoc) {
      req.loginAttemptEmailDoc.failedAttempts += 1;
      req.loginAttemptEmailDoc.lastAttemptAt = now;
      if (req.loginAttemptEmailDoc.failedAttempts >= MAX_FAILED_ATTEMPTS) {
        req.loginAttemptEmailDoc.lockUntil = lockUntil;
      }
      await req.loginAttemptEmailDoc.save();
    } else {
      await LoginAttempt.create({
        identifier: email.toLowerCase(),
        type: "email",
        failedAttempts: 1,
        lastAttemptAt: now,
        lockUntil:
          MAX_FAILED_ATTEMPTS === 1 ? lockUntil : undefined,
      });
    }
  }

  // Record IP-based failure
  if (req.loginAttemptIpDoc) {
    req.loginAttemptIpDoc.failedAttempts += 1;
    req.loginAttemptIpDoc.lastAttemptAt = now;
    if (req.loginAttemptIpDoc.failedAttempts >= MAX_FAILED_ATTEMPTS) {
      req.loginAttemptIpDoc.lockUntil = lockUntil;
    }
    await req.loginAttemptIpDoc.save();
  } else {
    await LoginAttempt.create({
      identifier: ip,
      type: "ip",
      failedAttempts: 1,
      lastAttemptAt: now,
      lockUntil: MAX_FAILED_ATTEMPTS === 1 ? lockUntil : undefined,
    });
  }
};

const resetFailedAttempts = async (req) => {
  const { email } = req.body;
  const ip = req.clientIp || getClientIp(req);

  if (email && req.loginAttemptEmailDoc) {
    req.loginAttemptEmailDoc.failedAttempts = 0;
    req.loginAttemptEmailDoc.lockUntil = undefined;
    req.loginAttemptEmailDoc.lastAttemptAt = new Date();
    await req.loginAttemptEmailDoc.save();
  }

  if (req.loginAttemptIpDoc) {
    req.loginAttemptIpDoc.failedAttempts = 0;
    req.loginAttemptIpDoc.lockUntil = undefined;
    req.loginAttemptIpDoc.lastAttemptAt = new Date();
    await req.loginAttemptIpDoc.save();
  }
};

module.exports = {
  loginAttemptMiddleware,
  recordFailedAttempt,
  resetFailedAttempts,
  MAX_FAILED_ATTEMPTS,
  LOCKOUT_DURATION_MS,
};