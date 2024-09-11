function isAdmin(req, res, next) {
  try {
    if (!req.body.id) throw new Error("Please log in to proceed");

    const {
      body: { admin, user },
    } = req;

    if (user || !admin) throw new Error("Unauthorized action, Not an admin.");

    if (admin && !user) next();
  } catch (err) {
    if (err?.message) res.status(500).json({ error: err?.message });
  }
}

module.exports = { isAdmin };
