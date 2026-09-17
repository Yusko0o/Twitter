const db = require("../database");

async function findUserByEmail(email) {
  const result = await db.query(
    `
      SELECT id, username, email, password_hash, avatar, bio, created_at
      FROM users
      WHERE email = $1
      LIMIT 1
    `,
    [email],
  );

  return result.rows[0] || null;
}

async function findUserById(id) {
  const result = await db.query(
    `
      SELECT
        u.id,
        u.username,
        u.email,
        u.avatar,
        u.bio,
        u.created_at,
        (SELECT COUNT(*)::int FROM posts WHERE user_id = u.id) AS posts_count,
        (SELECT COUNT(*)::int FROM follows WHERE following_id = u.id) AS followers_count,
        (SELECT COUNT(*)::int FROM follows WHERE follower_id = u.id) AS following_count
      FROM users u
      WHERE u.id = $1
      LIMIT 1
    `,
    [id],
  );

  return result.rows[0] || null;
}

async function createUser(username, email, passwordHash) {
  const result = await db.query(
    `
      INSERT INTO users (username, email, password_hash)
      VALUES ($1, $2, $3)
      RETURNING id, username, email, avatar, bio, created_at
    `,
    [username, email, passwordHash],
  );

  return result.rows[0];
}

async function emailExists(email) {
  const result = await db.query(`SELECT 1 FROM users WHERE email = $1 LIMIT 1`, [email]);
  return result.rowCount > 0;
}

async function usernameExists(username) {
  const result = await db.query(
    `SELECT 1 FROM users WHERE LOWER(username) = LOWER($1) LIMIT 1`,
    [username],
  );
  return result.rowCount > 0;
}

async function usernameExistsForOtherUser(username, userId) {
  const result = await db.query(
    `SELECT 1 FROM users WHERE LOWER(username) = LOWER($1) AND id != $2 LIMIT 1`,
    [username, userId],
  );
  return result.rowCount > 0;
}

async function updateUser(userId, username, bio, avatar) {
  const result = await db.query(
    `
      UPDATE users
      SET username = $1, bio = $2, avatar = COALESCE($3, avatar)
      WHERE id = $4
      RETURNING id, username, email, avatar, bio, created_at
    `,
    [username, bio, avatar, userId],
  );

  return result.rows[0] || null;
}

module.exports = {
  findUserByEmail,
  findUserById,
  createUser,
  emailExists,
  usernameExists,
  usernameExistsForOtherUser,
  updateUser,
};
