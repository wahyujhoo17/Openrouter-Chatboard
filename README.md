# AI Chatboard (OpenRouter) — Modern Chat UI

This project is a minimal, modern AI Chatboard using OpenRouter's chat completions API. It includes a Node.js + Express backend, PostgreSQL storage, and a Tailwind-based frontend.

## Features

- Chat UI with user/assistant bubbles
- Saves chat history to PostgreSQL (`messages` table)
- Sends user messages to OpenRouter (server-side)
- Basic rate limiting for `/api/chat`
- Clear chat, copy message, auto-scroll, loading indicator

## Files

- `server.js` — Express server
- `config/database.js` — PostgreSQL pool
- `routes/chat.js` — API routes
- `controllers/chatController.js` — OpenRouter integration
- `models/messageModel.js` — DB operations
- `public/` — frontend HTML/CSS/JS
- `database/schema.sql` — DB schema
- `.env.example` — environment variables sample

## Dependencies

Node dependencies are in `package.json` (express, axios, pg, dotenv, express-rate-limit).

## Install & Run

1. Copy `.env.example` to `.env` and fill values.
2. Install dependencies:

```bash
npm install
```

3. Prepare database (PostgreSQL):

```bash
# create database (example)
createdb ai_chatboard
# then run SQL to create table
psql -d ai_chatboard -f database/schema.sql
```

4. Run the server (development):

```bash
npm run dev
```

5. Visit `http://localhost:3000`.

## Example request to backend

Curl example sending a chat message to your backend:

```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Hello AI"}'
```

## Example OpenRouter request (server-side)

The server sends a JSON body like:

```json
{
  "model": "openai/gpt-4o-mini",
  "messages": [{ "role": "user", "content": "Hello" }]
}
```

Set `OPENROUTER_API_KEY` in `.env`. The backend includes the API key in the `Authorization: Bearer ...` header.

## Notes & Next steps

- You can switch to MySQL by changing `config/database.js` and SQL.
- For production: add proper auth, CORS, input sanitization, pagination for messages, and robust error handling.
- Bonus features (streaming, markdown, dark mode) can be added to frontend and backend.
