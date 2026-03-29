const chatWindow = document.getElementById('chatWindow');
const chatForm = document.getElementById('chatForm');
const inputMsg = document.getElementById('inputMsg');
const status = document.getElementById('status');
const clearBtn = document.getElementById('clearBtn');
const sidebar = document.getElementById('sidebar');
const sidebarToggle = document.getElementById('sidebarToggle');
const sidebarClose = document.getElementById('sidebarClose');
const sidebarOverlay = document.getElementById('sidebarOverlay');

function openSidebar() {
    sidebar?.classList.remove('-translate-x-full');
    sidebar?.classList.add('translate-x-0');
    sidebarOverlay?.classList.remove('hidden');
}

function closeSidebar() {
    sidebar?.classList.add('-translate-x-full');
    sidebar?.classList.remove('translate-x-0');
    sidebarOverlay?.classList.add('hidden');
}

sidebarToggle?.addEventListener('click', openSidebar);
sidebarClose?.addEventListener('click', closeSidebar);
sidebarOverlay?.addEventListener('click', closeSidebar);

if (window.innerWidth < 768) {
    closeSidebar();
}

window.addEventListener('resize', () => {
    if (window.innerWidth >= 768) {
        sidebar?.classList.remove('-translate-x-full');
        sidebar?.classList.add('translate-x-0');
        sidebarOverlay?.classList.add('hidden');
    } else {
        sidebar?.classList.add('-translate-x-full');
        sidebar?.classList.remove('translate-x-0');
        sidebarOverlay?.classList.add('hidden');
    }
});

function appendMessage(role, text) {
    const row = document.createElement('div');
    row.className = 'flex items-start gap-3 mb-2';
    if (role === 'user') {
        row.classList.add('justify-end');
    } else {
        row.classList.add('justify-start');
    }

    const avatar = document.createElement('div');
    avatar.className = 'w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-white shrink-0';
    avatar.style.backgroundColor = role === 'user' ? '#2563eb' : '#64748b';
    avatar.innerText = role === 'user' ? 'You' : 'AI';

    const messageCard = document.createElement('div');
    messageCard.className = 'max-w-[80%] bg-white p-3 rounded-2xl shadow-sm border border-slate-200';
    messageCard.style.whiteSpace = 'pre-wrap';

    if (role === 'user') {
        messageCard.classList.remove('bg-white');
        messageCard.classList.add('bg-blue-600', 'text-white', 'border-transparent');
        messageCard.style.borderColor = 'transparent';
    } else {
        messageCard.classList.add('bg-slate-50', 'text-slate-800');
    }

    const messageMeta = document.createElement('div');
    messageMeta.className = 'text-[11px] font-medium mb-1 opacity-80';
    messageMeta.innerText = role === 'user' ? 'You' : 'Assistant';

    const bubble = document.createElement('div');
    bubble.className = 'leading-relaxed whitespace-pre-wrap';
    bubble.innerText = text;

    const tools = document.createElement('div');
    tools.className = 'mt-2 flex justify-end';
    const copyBtn = document.createElement('button');
    copyBtn.className = 'text-xs font-medium text-slate-500 hover:text-slate-700 focus:outline-none';
    copyBtn.innerText = 'Copy';
    copyBtn.onclick = (e) => {
        e.stopPropagation();
        navigator.clipboard.writeText(text).then(() => {
            copyBtn.innerText = 'Copied';
            setTimeout(() => (copyBtn.innerText = 'Copy'), 1200);
        });
    };
    tools.appendChild(copyBtn);

    messageCard.appendChild(messageMeta);
    messageCard.appendChild(bubble);
    messageCard.appendChild(tools);

    if (role === 'user') {
        row.appendChild(messageCard);
        row.appendChild(avatar);
    } else {
        row.appendChild(avatar);
        row.appendChild(messageCard);
    }

    chatWindow.appendChild(row);
    chatWindow.scrollTop = chatWindow.scrollHeight;
}

function setStatus(txt) {
    status.innerText = txt || '';
}

async function loadHistory() {
    try {
        const r = await fetch('/api/messages');
        const data = await r.json();
        chatWindow.innerHTML = '';
        if (data.messages && data.messages.length) {
            data.messages.forEach(m => appendMessage(m.role, m.content));
        }
    } catch (err) {
        console.error(err);
    }
}

chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = inputMsg.value.trim();
    if (!text) return;

    appendMessage('user', text);
    inputMsg.value = '';
    setStatus('AI is thinking...');

    // show typing bubble
    const typingId = 'typing-bubble';
    const typing = document.createElement('div');
    typing.id = typingId;
    typing.className = 'text-slate-500';
    typing.innerText = '…';
    const typingWrap = document.createElement('div');
    typingWrap.className = 'flex';
    const bubble = document.createElement('div');
    bubble.className = 'max-w-[80%] p-3 rounded-xl shadow-sm bg-slate-100 text-slate-500 rounded-bl-none';
    bubble.innerText = 'Thinking...';
    typingWrap.appendChild(bubble);
    chatWindow.appendChild(typingWrap);
    chatWindow.scrollTop = chatWindow.scrollHeight;

    try {
        const res = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: text })
        });
        const result = await res.json();
        document.getElementById(typingId)?.remove();
        if (result.reply) {
            appendMessage('assistant', result.reply);
            setStatus('');
        } else if (result.error) {
            appendMessage('assistant', 'Error: ' + result.error);
            setStatus('');
        }
    } catch (err) {
        document.getElementById(typingId)?.remove();
        appendMessage('assistant', 'Network error');
        setStatus('');
        console.error(err);
    }
});

clearBtn.addEventListener('click', async () => {
    if (!confirm('Clear all chat history?')) return;
    await fetch('/api/clear', { method: 'POST' });
    await loadHistory();
});

// initial load
loadHistory();
