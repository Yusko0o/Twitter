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

async function getPosts(currentUserId = null, bookmarksOnly = false) {
  const result = await db.query(
    `
      SELECT
        p.id,
        p.user_id,
        p.content,
        p.image_url,
        p.video_url,
        p.created_at,
        u.username,
        u.avatar,
        COUNT(DISTINCT l.user_id)::int AS likes_count,
        COUNT(DISTINCT c.id)::int AS comments_count,
        EXISTS(
          SELECT 1 FROM likes mine
          WHERE mine.post_id = p.id AND mine.user_id = $1
        ) AS liked_by_me,
        EXISTS(
          SELECT 1 FROM bookmarks mine_b
          WHERE mine_b.post_id = p.id AND mine_b.user_id = $1
        ) AS bookmarked_by_me,
        (p.user_id = $1) AS is_owner
      FROM posts p
      JOIN users u ON u.id = p.user_id
      LEFT JOIN likes l ON l.post_id = p.id
      LEFT JOIN comments c ON c.post_id = p.id
      WHERE ($2::boolean = false OR EXISTS (
        SELECT 1 FROM bookmarks b
        WHERE b.post_id = p.id AND b.user_id = $1
      ))
      GROUP BY p.id, u.id
      ORDER BY p.created_at DESC
      LIMIT 100
    `,
    [currentUserId, bookmarksOnly],
  );
  return result.rows;
}

async function deletePost(postId, userId) {
  const result = await db.query(
    `DELETE FROM posts WHERE id = $1 AND user_id = $2 RETURNING id`,
    [postId, userId],
  );
  return result.rows[0] || null;
}

async function likePost(postId, userId) {
  await db.query(
    `INSERT INTO likes (user_id, post_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
    [userId, postId],
  );
}

async function unlikePost(postId, userId) {
  await db.query(`DELETE FROM likes WHERE user_id = $1 AND post_id = $2`, [userId, postId]);
}

async function bookmarkPost(postId, userId) {
  await db.query(
    `INSERT INTO bookmarks (user_id, post_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
    [userId, postId],
  );
}

async function unbookmarkPost(postId, userId) {
  await db.query(`DELETE FROM bookmarks WHERE user_id = $1 AND post_id = $2`, [userId, postId]);
}

async function getComments(postId) {
  const result = await db.query(
    `
      SELECT c.id, c.post_id, c.user_id, c.content, c.created_at, u.username, u.avatar
      FROM comments c
      JOIN users u ON u.id = c.user_id
      WHERE c.post_id = $1
      ORDER BY c.created_at ASC
    `,
    [postId],
  );
  return result.rows;
}

async function addComment(postId, userId, content) {
  const result = await db.query(
    `
      INSERT INTO comments (post_id, user_id, content)
      VALUES ($1, $2, $3)
      RETURNING id, post_id, user_id, content, created_at
    `,
    [postId, userId, content],
  );
  return result.rows[0];
}

async function deleteComment(postId, commentId, userId) {
  const result = await db.query(
    `
      DELETE FROM comments
      WHERE id = $1 AND post_id = $2 AND user_id = $3
      RETURNING id
    `,
    [commentId, postId, userId],
  );
  return result.rows[0] || null;
}

async function postExists(postId) {
  const result = await db.query(`SELECT 1 FROM posts WHERE id = $1 LIMIT 1`, [postId]);
  return result.rowCount > 0;
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
  postExists,
};
