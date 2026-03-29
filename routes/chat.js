const express = require('express');
const router = express.Router();
const { handleChat, getMessages, handleClear } = require('../controllers/chatController');

router.post('/chat', handleChat);
router.get('/messages', getMessages);
router.post('/clear', handleClear);

module.exports = router;
