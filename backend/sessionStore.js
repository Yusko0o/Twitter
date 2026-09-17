const session = require("express-session");
const db = require("./database");

class PostgresSessionStore extends session.Store {
  constructor() {
    super();
    this.cleanupTimer = setInterval(() => {
      this.prune().catch((error) => {
        console.error("Session cleanup error:", error);
      });
    }, 15 * 60 * 1000);
    this.cleanupTimer.unref?.();
  }

  get(sid, callback) {
    db.query(
      `SELECT sess FROM app_sessions WHERE sid = $1 AND expire > NOW() LIMIT 1`,
      [sid],
    )
      .then((result) => callback(null, result.rows[0]?.sess || null))
      .catch((error) => callback(error));
  }

  set(sid, sess, callback = () => {}) {
    const expire = getExpiration(sess);

    db.query(
      `
        INSERT INTO app_sessions (sid, sess, expire)
        VALUES ($1, $2::jsonb, $3)
        ON CONFLICT (sid)
        DO UPDATE SET sess = EXCLUDED.sess, expire = EXCLUDED.expire
      `,
      [sid, JSON.stringify(sess), expire],
    )
      .then(() => callback(null))
      .catch((error) => callback(error));
  }

  destroy(sid, callback = () => {}) {
    db.query(`DELETE FROM app_sessions WHERE sid = $1`, [sid])
      .then(() => callback(null))
      .catch((error) => callback(error));
  }

  touch(sid, sess, callback = () => {}) {
    const expire = getExpiration(sess);

    db.query(`UPDATE app_sessions SET expire = $2 WHERE sid = $1`, [sid, expire])
      .then(() => callback(null))
      .catch((error) => callback(error));
  }

  async prune() {
    await db.query(`DELETE FROM app_sessions WHERE expire <= NOW()`);
  }
}

function getExpiration(sess) {
  if (sess?.cookie?.expires) {
    const expires = new Date(sess.cookie.expires);
    if (!Number.isNaN(expires.getTime())) {
      return expires;
    }
  }

  const maxAge = Number(sess?.cookie?.maxAge) || 1000 * 60 * 60 * 24 * 30;
  return new Date(Date.now() + maxAge);
}

module.exports = PostgresSessionStore;
