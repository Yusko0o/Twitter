const express = require("express");
const requireAuth = require("../middleware/authMiddleware");
const {
  createPost,
  getPosts,
  deletePost,
  likePost,
  unlikePost,
  bookmarkPost,
  unbookmarkPost,
  getComments,
  addComment,
  deleteComment,
} = require("../controllers/postController");

const router = express.Router();

router.get("/", getPosts);
router.post("/", requireAuth, createPost);
router.delete("/:id", requireAuth, deletePost);
router.post("/:id/like", requireAuth, likePost);
router.delete("/:id/like", requireAuth, unlikePost);
router.post("/:id/bookmark", requireAuth, bookmarkPost);
router.delete("/:id/bookmark", requireAuth, unbookmarkPost);
router.get("/:id/comments", getComments);
router.post("/:id/comments", requireAuth, addComment);
router.delete("/:id/comments/:commentId", requireAuth, deleteComment);

module.exports = router;
