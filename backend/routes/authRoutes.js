const express = require("express");

const {
  register,
  login,
  logout,
  me,
  updateProfile,
} = require("../controllers/authController");

const router = express.Router();

router.post("/register", register);

router.post("/login", login);

router.post("/logout", logout);

router.get("/me", me);

router.put("/me", updateProfile);

module.exports = router;
