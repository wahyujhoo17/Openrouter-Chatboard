import { Pool } from 'pg'

declare global {
  var _pgPool: Pool | undefined
}

function getPool(): Pool {
  if (!global._pgPool) {
    global._pgPool = new Pool({
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT) || 5432,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      ssl: false,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    })
  }
  return global._pgPool
}

// ─── Users ────────────────────────────────────────────────────────────────────

export interface User {
  id: number
  name: string
  email: string
  password_hash: string
  plan: 'free' | 'pro'
  created_at: string
}

export async function createUser(name: string, email: string, passwordHash: string): Promise<User> {
  const pool = getPool()
  const res = await pool.query(
    `INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING *`,
    [name, email, passwordHash]
  )
  return res.rows[0]
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const pool = getPool()
  const res = await pool.query(`SELECT * FROM users WHERE email = $1`, [email])
  return res.rows[0] || null
}

export async function getUserById(id: number): Promise<User | null> {
  const pool = getPool()
  const res = await pool.query(`SELECT * FROM users WHERE id = $1`, [id])
  return res.rows[0] || null
}

// ─── Conversations ─────────────────────────────────────────────────────────────

export interface Conversation {
  id: number
  user_id: number
  title: string
  model: string
  created_at: string
  updated_at: string
  message_count?: number
}

export async function createConversation(userId: number, model: string): Promise<Conversation> {
  const pool = getPool()
  const res = await pool.query(
    `INSERT INTO conversations (user_id, model) VALUES ($1, $2) RETURNING *`,
    [userId, model]
  )
  return res.rows[0]
}

export async function getConversationsByUser(userId: number): Promise<Conversation[]> {
  const pool = getPool()
  const res = await pool.query(
    `SELECT c.*, COUNT(m.id)::int AS message_count
     FROM conversations c
     LEFT JOIN messages m ON m.conversation_id = c.id
     WHERE c.user_id = $1
     GROUP BY c.id
     ORDER BY c.updated_at DESC
     LIMIT 60`,
    [userId]
  )
  return res.rows
}

export async function getConversationById(id: number, userId: number): Promise<Conversation | null> {
  const pool = getPool()
  const res = await pool.query(
    `SELECT * FROM conversations WHERE id = $1 AND user_id = $2`,
    [id, userId]
  )
  return res.rows[0] || null
}

export async function updateConversationTitle(id: number, title: string): Promise<void> {
  const pool = getPool()
  await pool.query(`UPDATE conversations SET title = $1 WHERE id = $2`, [title, id])
}

export async function touchConversation(id: number): Promise<void> {
  const pool = getPool()
  await pool.query(`UPDATE conversations SET updated_at = NOW() WHERE id = $1`, [id])
}

export async function deleteConversation(id: number, userId: number): Promise<void> {
  const pool = getPool()
  await pool.query(`DELETE FROM conversations WHERE id = $1 AND user_id = $2`, [id, userId])
}

// ─── Messages ─────────────────────────────────────────────────────────────────

export interface Message {
  id: number
  conversation_id: number
  role: 'user' | 'assistant' | 'system'
  content: string
  created_at: string
}

export async function saveMessage(
  conversationId: number,
  role: 'user' | 'assistant' | 'system',
  content: string
): Promise<Message> {
  const pool = getPool()
  const res = await pool.query(
    `INSERT INTO messages (conversation_id, role, content) VALUES ($1, $2, $3) RETURNING *`,
    [conversationId, role, content]
  )
  return res.rows[0]
}

export async function getMessages(conversationId: number, limit = 200): Promise<Message[]> {
  const pool = getPool()
  const res = await pool.query(
    `SELECT * FROM messages WHERE conversation_id = $1 ORDER BY created_at ASC LIMIT $2`,
    [conversationId, limit]
  )
  return res.rows
}

export async function clearConversationMessages(conversationId: number, userId: number): Promise<void> {
  const pool = getPool()
  await pool.query(
    `DELETE FROM messages WHERE conversation_id IN (
       SELECT id FROM conversations WHERE id = $1 AND user_id = $2
     )`,
    [conversationId, userId]
  )
}
