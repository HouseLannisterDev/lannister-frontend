document.addEventListener('DOMContentLoaded', () => {
  const chatBtn     = document.getElementById('open-chatbot');
  const chatWindow  = document.getElementById('chatbot-window');
  const closeBtn    = document.getElementById('close-chat');
  const sendBtn     = document.getElementById('send-btn');
  const userInput   = document.getElementById('user-input');
  const chatBody    = document.getElementById('chat-body');

  function appendUserMessage(text) {
    const p = document.createElement('p');
    p.classList.add('user-msg');
    p.textContent = text;
    chatBody.appendChild(p);
    chatBody.scrollTop = chatBody.scrollHeight;
  }

  function appendBotMessage(text) {
    const p = document.createElement('p');
    p.classList.add('bot-msg');   // CSS con white-space: pre-line
    p.textContent = text;         // seguridad + respeta \n
    chatBody.appendChild(p);
    chatBody.scrollTop = chatBody.scrollHeight;
  }

  async function sendMessage() {
    const message = userInput.value.trim();
    if (!message) return;

    appendUserMessage(message);
    userInput.value = '';

    try {
      const response = await fetch('http://localhost:5000/api/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message })
      });

      const data = await response.json();
      appendBotMessage(data.response || '');
    } catch (err) {
      console.error('Error al contactar al chatbot:', err);
      appendBotMessage('Ups, tuve un problema al responder. Intenta de nuevo en un momento 🙏');
    }
  }

  chatBtn.addEventListener('click', () => {
    chatWindow.style.display = 'flex';
  });

  closeBtn.addEventListener('click', () => {
    chatWindow.style.display = 'none';
  });

  sendBtn.addEventListener('click', sendMessage);
  userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
  });
});
