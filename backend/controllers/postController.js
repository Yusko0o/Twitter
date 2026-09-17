const postModel = require("../models/postModel");

function parsePostId(value) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

async function createPost(req, res) {
  try {
    let { content, imageUrl, videoUrl } = req.body;
    content = typeof content === "string" ? content.trim() : "";
    imageUrl = typeof imageUrl === "string" ? imageUrl : null;
    videoUrl = typeof videoUrl === "string" ? videoUrl : null;

    if (!content && !imageUrl && !videoUrl) {
      return res.status(400).json({ error: "Post cannot be empty" });
    }

    if (content.length > 500) {
      return res.status(400).json({ error: "Post cannot exceed 500 characters" });
    }

    if (imageUrl && !/^data:image\/(png|jpeg|jpg|webp|gif);base64,/i.test(imageUrl)) {
      return res.status(400).json({ error: "Invalid image format" });
    }

    if (videoUrl && !/^data:video\/(mp4|webm|ogg);base64,/i.test(videoUrl)) {
      return res.status(400).json({ error: "Invalid video format" });
    }

    if ((imageUrl && imageUrl.length > 3_000_000) || (videoUrl && videoUrl.length > 4_000_000)) {
      return res.status(400).json({ error: "Media file is too large" });
    }

    const post = await postModel.createPost(req.user.id, content, imageUrl, videoUrl);
    return res.status(201).json(post);
  } catch (error) {
    console.error("Create post error:", error);
    return res.status(500).json({ error: "Failed to create post" });
  }
}

async function getPosts(req, res) {
  try {
    const currentUserId = req.session.user?.id || null;
    const bookmarksOnly = req.query.bookmarked === "1";

    if (bookmarksOnly && !currentUserId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const posts = await postModel.getPosts(currentUserId, bookmarksOnly);
    return res.json(posts);
  } catch (error) {
    console.error("Get posts error:", error);
    return res.status(500).json({ error: "Failed to fetch posts" });
  }
}

async function deletePost(req, res) {
  try {
    const id = parsePostId(req.params.id);
    if (!id) return res.status(400).json({ error: "Invalid post id" });

    const post = await postModel.deletePost(id, req.user.id);
    if (!post) return res.status(404).json({ error: "Post not found" });

    return res.json({ message: "Post deleted" });
  } catch (error) {
    console.error("Delete post error:", error);
    return res.status(500).json({ error: "Failed to delete post" });
  }
}

async function likePost(req, res) {
  try {
    const id = parsePostId(req.params.id);
    if (!id || !(await postModel.postExists(id))) {
      return res.status(404).json({ error: "Post not found" });
    }
    await postModel.likePost(id, req.user.id);
    return res.json({ liked: true });
  } catch (error) {
    console.error("Like post error:", error);
    return res.status(500).json({ error: "Failed to like post" });
  }
}

async function unlikePost(req, res) {
  try {
    const id = parsePostId(req.params.id);
    if (!id) return res.status(400).json({ error: "Invalid post id" });
    await postModel.unlikePost(id, req.user.id);
    return res.json({ liked: false });
  } catch (error) {
    console.error("Unlike post error:", error);
    return res.status(500).json({ error: "Failed to unlike post" });
  }
}

async function bookmarkPost(req, res) {
  try {
    const id = parsePostId(req.params.id);
    if (!id || !(await postModel.postExists(id))) {
      return res.status(404).json({ error: "Post not found" });
    }
    await postModel.bookmarkPost(id, req.user.id);
    return res.json({ bookmarked: true });
  } catch (error) {
    console.error("Bookmark post error:", error);
    return res.status(500).json({ error: "Failed to bookmark post" });
  }
}

async function unbookmarkPost(req, res) {
  try {
    const id = parsePostId(req.params.id);
    if (!id) return res.status(400).json({ error: "Invalid post id" });
    await postModel.unbookmarkPost(id, req.user.id);
    return res.json({ bookmarked: false });
  } catch (error) {
    console.error("Unbookmark post error:", error);
    return res.status(500).json({ error: "Failed to remove bookmark" });
  }
}

async function getComments(req, res) {
  try {
    const id = parsePostId(req.params.id);
    if (!id) return res.status(400).json({ error: "Invalid post id" });
    return res.json(await postModel.getComments(id));
  } catch (error) {
    console.error("Get comments error:", error);
    return res.status(500).json({ error: "Failed to fetch comments" });
  }
}

async function addComment(req, res) {
  try {
    const id = parsePostId(req.params.id);
    const content = typeof req.body.content === "string" ? req.body.content.trim() : "";

    if (!id || !(await postModel.postExists(id))) {
      return res.status(404).json({ error: "Post not found" });
    }
    if (!content || content.length > 500) {
      return res.status(400).json({ error: "Comment must contain between 1 and 500 characters" });
    }

    const comment = await postModel.addComment(id, req.user.id, content);
    return res.status(201).json(comment);
  } catch (error) {
    console.error("Add comment error:", error);
    return res.status(500).json({ error: "Failed to add comment" });
  }
}

async function deleteComment(req, res) {
  try {
    const postId = parsePostId(req.params.id);
    const commentId = parsePostId(req.params.commentId);
    if (!postId || !commentId) return res.status(400).json({ error: "Invalid id" });

    const deleted = await postModel.deleteComment(postId, commentId, req.user.id);
    if (!deleted) return res.status(404).json({ error: "Comment not found" });
    return res.json({ message: "Comment deleted" });
  } catch (error) {
    console.error("Delete comment error:", error);
    return res.status(500).json({ error: "Failed to delete comment" });
  }
}

module.exports = {
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
};
