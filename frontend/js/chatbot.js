// === util: leer cookies (déjalo arriba de todo) ===========================
function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
}
// ========================================================================

// === util: escapar HTML y convertir URLs en enlaces clicables ============
function escapeHTML(str = "") {
  return str
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function linkify(text = "") {
  let safe = escapeHTML(text);

  // URLs con http/https
  const urlRegex = /\bhttps?:\/\/[^\s<)]+/gi;
  // dominios tipo www.ejemplo.com
  const wwwRegex = /(^|[\s(])www\.[^\s<)]+/gi;

  safe = safe.replace(urlRegex, (m) => {
    return `<a href="${m}" target="_blank" rel="noopener noreferrer">${m}</a>`;
  });

  safe = safe.replace(wwwRegex, (m) => {
    const prefix = m.startsWith("w") ? "" : m[0];
    const url = m.startsWith("w") ? m : m.slice(1);
    const href = `https://${url.trim()}`;
    return `${prefix}<a href="${href}" target="_blank" rel="noopener noreferrer">${url.trim()}</a>`;
  });

  // Conserva saltos de línea
  safe = safe.replace(/\n/g, "<br>");
  return safe;
}
// ========================================================================

document.addEventListener('DOMContentLoaded', () => {
  const chatBtn     = document.getElementById('open-chatbot');
  const chatWindow  = document.getElementById('chatbot-window');
  const closeBtn    = document.getElementById('close-chat');
  const sendBtn     = document.getElementById('send-btn');
  const userInput   = document.getElementById('user-input');
  const chatBody    = document.getElementById('chat-body');

  const CHATBOT_API = 'https://api.lannister-news.com/chatbot/';

  function appendUserMessage(text) {
    const p = document.createElement('p');
    p.classList.add('user-msg');
    p.textContent = text;
    chatBody.appendChild(p);
    chatBody.scrollTop = chatBody.scrollHeight;
  }

  function appendBotMessage(text) {
    const p = document.createElement('p');
    p.classList.add('bot-msg');
    p.innerHTML = linkify(text || ''); // 💡 ahora los links son clicables
    chatBody.appendChild(p);
    chatBody.scrollTop = chatBody.scrollHeight;
  }

  function appendTyping() {
    const p = document.createElement('p');
    p.classList.add('bot-msg', 'typing');
    p.textContent = 'Escribiendo…';
    chatBody.appendChild(p);
    chatBody.scrollTop = chatBody.scrollHeight;
    return p;
  }

  async function sendMessage() {
    const message = (userInput.value || '').trim();
    if (!message) return;

    appendUserMessage(message);
    userInput.value = '';

    const typingNode = appendTyping();
    sendBtn.disabled = true;

    try {
      // 1) GET previo para obtener csrftoken
      await fetch(CHATBOT_API, {
        method: 'GET',
        credentials: 'include',
      });

      // 2) POST con cookie + CSRF
      const csrftoken = getCookie('csrftoken') || '';

      const res = await fetch(CHATBOT_API, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrftoken,
        },
        body: JSON.stringify({ question: message }),
      });

      if (!res.ok) {
        let errTxt = 'Error del servidor.';
        try {
          const e = await res.json();
          errTxt = e.error || e.detail || errTxt;
        } catch (_) {}
        throw new Error(errTxt);
      }

      const data = await res.json(); // { question, answer }
      appendBotMessage(data.answer);
    } catch (err) {
      console.error('Error chatbot:', err);
      appendBotMessage('Ups, tuve un problema al responder. Intenta de nuevo en un momento 🙏');
    } finally {
      if (typingNode && typingNode.parentNode) typingNode.parentNode.removeChild(typingNode);
      sendBtn.disabled = false;
    }
  }

  chatBtn?.addEventListener('click', () => {
    chatWindow.style.display = 'flex';
    userInput.focus();
  });

  closeBtn?.addEventListener('click', () => {
    chatWindow.style.display = 'none';
  });

  sendBtn?.addEventListener('click', sendMessage);
  userInput?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
  });
});
