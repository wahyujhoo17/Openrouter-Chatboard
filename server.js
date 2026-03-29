const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const rateLimit = require('express-rate-limit');

dotenv.config();

const chatRouter = require('./routes/chat');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Basic rate limiter for /api/chat
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 60,
    message: { error: 'Too many requests, please try again later.' }
});

app.use('/api/chat', limiter);

// API routes
app.use('/api', chatRouter);

// Serve static frontend
app.use(express.static(path.join(__dirname, 'public')));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
