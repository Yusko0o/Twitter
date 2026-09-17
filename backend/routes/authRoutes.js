const express = require("express");
const { register, login, logout, me, updateProfile } = require("../controllers/authController");
const requireAuth = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout", requireAuth, logout);
router.get("/me", requireAuth, me);
router.put("/me", requireAuth, updateProfile);

module.exports = router;
