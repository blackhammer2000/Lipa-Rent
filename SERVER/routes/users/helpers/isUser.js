function isUser(req, res, next) {
  try {
    if (!req.headers.user) throw new Error("Unauthorized action, Not a user.");

    const {
      headers: { admin, user },
    } = req;

    if (admin) throw new Error("Unauthorized action, Not a user.");

    if (user) next();
  } catch (err) {
    if (err?.message) res.status(500).json({ error: err?.message });
  }
}

module.exports = { isUser };
