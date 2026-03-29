const axios = require('axios');
const { saveMessage, getAllMessages, clearMessages } = require('../models/messageModel');

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const DEFAULT_MODEL = process.env.OPENROUTER_MODEL || 'arcee-ai/trinity-large-preview:free';
const FALLBACK_MODELS = [
    'arcee-ai/trinity-large-preview:free',
    'meta-llama/llama-3.3-70b-instruct:free',
    'google/gemma-3-27b-it:free',
    'mistralai/codestral:free'
];

async function handleChat(req, res) {
    try {
        const { message } = req.body;
        if (!message || typeof message !== 'string') {
            return res.status(400).json({ error: 'Invalid message' });
        }

        // Save user message (non-blocking failures logged)
        try {
            await saveMessage('user', message);
        } catch (dbErr) {
            console.warn('Warning: could not save user message:', dbErr.message || dbErr);
        }

        // Call OpenRouter with fallback models
        const apiKey = process.env.OPENROUTER_API_KEY;
        if (!apiKey) return res.status(500).json({ error: 'Server misconfiguration' });

        const modelsToTry = [DEFAULT_MODEL, ...FALLBACK_MODELS.filter(m => m !== DEFAULT_MODEL)];
        let lastError;

        for (const model of modelsToTry) {
            try {
                console.log(`Trying model: ${model}`);
                const payload = {
                    model: model,
                    messages: [{ role: 'user', content: message }],
                    // Optional: add parameters to reduce guardrail issues
                    temperature: 0.7,
                    max_tokens: 2048
                };

                const orRes = await axios.post(OPENROUTER_URL, payload, {
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${apiKey}`,
                        // Add referer and title to satisfy OpenRouter requirements
                        'HTTP-Referer': process.env.OPENROUTER_REFERER || 'http://localhost:3000',
                        'X-Title': process.env.OPENROUTER_APP_NAME || 'AI Chatboard'
                    }
                });

                // Parse response
                let assistantText = '';
                if (orRes.data) {
                    if (orRes.data.choices && orRes.data.choices[0]) {
                        const choice = orRes.data.choices[0];
                        if (choice.message && choice.message.content) {
                            assistantText = choice.message.content;
                        } else if (choice.text) {
                            assistantText = choice.text;
                        } else {
                            assistantText = JSON.stringify(choice);
                        }
                    } else if (orRes.data.output && orRes.data.output[0]) {
                        const out = orRes.data.output[0];
                        if (out.content && out.content[0] && out.content[0].text) {
                            assistantText = out.content[0].text;
                        } else {
                            assistantText = JSON.stringify(out);
                        }
                    } else {
                        assistantText = JSON.stringify(orRes.data);
                    }
                }

                // Save assistant message (non-blocking failures logged)
                try {
                    await saveMessage('assistant', assistantText);
                } catch (dbErr) {
                    console.warn('Warning: could not save assistant message:', dbErr.message || dbErr);
                }

                return res.json({
                    reply: assistantText,
                    model: model // optionally return which model was used
                });
            } catch (err) {
                console.warn(`Model ${model} failed:`, err?.response?.data?.error || err.message);
                lastError = err;

                // Check if it's a guardrail restriction error
                const errorData = err?.response?.data;
                const errorMessage = errorData?.error || errorData?.message || err?.response?.statusText || err.message;

                if (errorMessage && (
                    errorMessage.includes('guardrail') ||
                    errorMessage.includes('restrictions') ||
                    errorMessage.includes('data policy') ||
                    err?.response?.status === 400
                )) {
                    // Continue to next model
                    continue;
                } else {
                    // For other errors (network, auth, etc), break and return error
                    break;
                }
            }
        }

        // If we got here, all models failed
        const finalError = lastError;
        const errorData = finalError?.response?.data;
        const errorMessage = errorData?.error || errorData?.message || finalError?.response?.statusText || finalError?.message || 'AI request failed';

        // Provide helpful message about guardrails
        let userMessage = errorMessage;
        if (errorMessage.includes('guardrail') || errorMessage.includes('restrictions') || errorMessage.includes('data policy')) {
            userMessage = 'Model tidak dapat digunakan karena batasan guardrail. Silakan periksa pengaturan privasi di OpenRouter: https://openrouter.ai/settings/privacy. Coba model free lain seperti Trinity Large Preview.';
        }

        return res.status(500).json({ error: userMessage });
    } catch (err) {
        console.error('Chat error', err);
        return res.status(500).json({ error: 'AI request failed' });
    }
}

async function getMessages(req, res) {
    try {
        const msgs = await getAllMessages(200);
        res.json({ messages: msgs });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch messages' });
    }
}

async function handleClear(req, res) {
    try {
        await clearMessages();
        res.json({ ok: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to clear messages' });
    }
}

module.exports = { handleChat, getMessages, handleClear };
