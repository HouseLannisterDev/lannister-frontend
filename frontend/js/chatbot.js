document.addEventListener('DOMContentLoaded', () => {
  const chatBtn     = document.getElementById('open-chatbot');
  const chatWindow  = document.getElementById('chatbot-window');
  const closeBtn    = document.getElementById('close-chat');
  const sendBtn     = document.getElementById('send-btn');
  const userInput   = document.getElementById('user-input');
  const chatBody    = document.getElementById('chat-body');

  
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
    p.classList.add('bot-msg');     // en tu CSS: .bot-msg { white-space: pre-line; }
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
    return p; // devuelve el nodo para poder removerlo
  }

  async function sendMessage() {
    const message = userInput.value.trim();
    if (!message) return;

    appendUserMessage(message);
    userInput.value = '';

    const typingNode = appendTyping();

    try {
      const res = await fetch(CHATBOT_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: message }),
        credentials: 'include', 
      });

      // Si la vista retorna error estructurado
      if (!res.ok) {
        let errTxt = 'Error del servidor.';
        try {
          const e = await res.json();
          errTxt = e.error || e.detail || errTxt;
        } catch {}
        throw new Error(errTxt);
      }

      const data = await res.json();
      // Django responde { question, answer }
      appendBotMessage(data.answer);
    } catch (err) {
      console.error('Error chatbot:', err);
      appendBotMessage('Ups, tuve un problema al responder. Intenta de nuevo en un momento 🙏');
    } finally {
      if (typingNode && typingNode.parentNode) {
        typingNode.parentNode.removeChild(typingNode);
      }
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
