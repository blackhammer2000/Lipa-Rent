const adminPostControllers = {
  login: async (req, res) => {
    try {
      if (!req.body.email || !req.body.password)
        throw new Error("Unauthorized action");

      const { email, password } = req.body;
    } catch (err) {
      if (err.message) res.status(500).json({ error: err.message });
    }
  },
};

module.exports = adminPostControllers;
