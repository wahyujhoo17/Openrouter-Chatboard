const db = require('../config/database');

async function saveMessage(role, content) {
    const q = `INSERT INTO messages (role, content, created_at) VALUES ($1, $2, NOW()) RETURNING *`;
    const res = await db.query(q, [role, content]);
    return res.rows[0];
}

async function getAllMessages(limit = 100) {
    const q = `SELECT id, role, content, created_at FROM messages ORDER BY created_at ASC LIMIT $1`;
    const res = await db.query(q, [limit]);
    return res.rows;
}

async function clearMessages() {
    await db.query(`TRUNCATE messages RESTART IDENTITY`);
}

module.exports = { saveMessage, getAllMessages, clearMessages };
