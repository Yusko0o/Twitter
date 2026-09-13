const db = require("../database");

async function createPost(userId, content, imageUrl, videoUrl) {
  const result = await db.query(
    `
      INSERT INTO posts (user_id, content, image_url, video_url)
      VALUES ($1, $2, $3, $4)
      RETURNING id, user_id, content, image_url, video_url, created_at
    `,
    [userId, content || null, imageUrl || null, videoUrl || null],
  );

  return result.rows[0];
}

async function getPosts() {
  const result = await db.query(`
    SELECT
      posts.id,
      posts.user_id,
      posts.content,
      posts.image_url,
      posts.video_url,
      posts.created_at,
      users.username,
      COALESCE(users.avatar, users.profile_picture) AS avatar,
      0 AS likes_count,
      0 AS comments_count
    FROM posts
    JOIN users ON users.id = posts.user_id
    ORDER BY posts.created_at DESC
  `);

  return result.rows;
}

async function deletePost(postId, userId) {
  const result = await db.query(
    `
      DELETE FROM posts
      WHERE id = $1 AND user_id = $2
      RETURNING id
    `,
    [postId, userId],
  );

  return result.rows[0] || null;
}

module.exports = {
  createPost,
  getPosts,
  deletePost,
};
