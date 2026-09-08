const express = require("express");

const router = express.Router();

const {
  createPost,
  getPosts,
  deletePost,
} = require("../controllers/postController");

const requireAuth = require("../middleware/authMiddleware");

router.get("/", getPosts);

router.post("/", requireAuth, createPost);

router.delete("/:id", requireAuth, deletePost);

module.exports = router;
