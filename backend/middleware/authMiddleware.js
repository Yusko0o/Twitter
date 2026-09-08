const userModel = require("../models/userModel");

async function requireAuth(req, res, next) {
  try {
    if (!req.session.user) {
      return res.status(401).json({
        error: "Authentication required",
      });
    }

    const user = await userModel.findUserById(req.session.user.id);

    if (!user) {
      req.session.destroy(() => {});

      return res.status(401).json({
        error: "Invalid session",
      });
    }

    req.user = user;

    next();
  } catch (error) {
    console.error("Authentication error:", error);

    return res.status(500).json({
      error: "Authentication error",
    });
  }
}

module.exports = requireAuth;
