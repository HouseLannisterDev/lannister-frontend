// === util: leer cookies (déjalo arriba de todo) ===========================
function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
}
// ========================================================================

document.addEventListener('DOMContentLoaded', () => {
  const chatBtn     = document.getElementById('open-chatbot');
  const chatWindow  = document.getElementById('chatbot-window');
  const closeBtn    = document.getElementById('close-chat');
  const sendBtn     = document.getElementById('send-btn');
  const userInput   = document.getElementById('user-input');
  const chatBody    = document.getElementById('chat-body');

  // 👇 importante: slash final
  const CHATBOT_API = 'https://lannister-news.com/chatbot/chatbot/';

  function appendUserMessage(text) {
    const p = document.createElement('p');
    p.classList.add('user-msg');
    p.textContent = text;
    chatBody.appendChild(p);
    chatBody.scrollTop = chatBody.scrollHeight;
  }

  function appendBotMessage(text) {
    const p = document.createElement('p');
    p.classList.add('bot-msg'); // en CSS: .bot-msg { white-space: pre-line; }
    p.textContent = text || '';
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
      // 1) GET previo para que el backend setee csrftoken
      await fetch(CHATBOT_API, {
        method: 'GET',
        credentials: 'include',
      });

      // 2) POST con cookie + header CSRF
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
