const postModel = require("../models/postModel");

async function createPost(req, res) {
  try {
    const { content, imageUrl, videoUrl } = req.body;

    if (!content && !imageUrl && !videoUrl) {
      return res.status(400).json({
        error: "Post cannot be empty",
      });
    }

    const post = await postModel.createPost(
      req.user.id,
      content,
      imageUrl,
      videoUrl,
    );

    res.status(201).json(post);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Failed to create post",
    });
  }
}

async function getPosts(req, res) {
  try {
    const posts = await postModel.getPosts();

    res.json(posts);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Failed to fetch posts",
    });
  }
}

async function deletePost(req, res) {
  try {
    const { id } = req.params;

    const post = await postModel.deletePost(id, req.user.id);

    if (!post) {
      return res.status(404).json({
        error: "Post not found",
      });
    }

    res.json({
      message: "Post deleted",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Failed to delete post",
    });
  }
}

module.exports = {
  createPost,
  getPosts,
  deletePost,
};
