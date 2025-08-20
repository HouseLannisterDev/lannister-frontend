document.addEventListener('DOMContentLoaded', () => {
  const chatBtn = document.getElementById('open-chatbot');
  const chatWindow = document.getElementById('chatbot-window');
  const closeBtn = document.getElementById('close-chat');
  const sendBtn = document.getElementById('send-btn');
  const userInput = document.getElementById('user-input');
  const chatBody = document.getElementById('chat-body');

  let currentAudio = null;

  chatBtn.addEventListener('click', () => {
    chatWindow.style.display = 'flex';
  });

  closeBtn.addEventListener('click', () => {
    chatWindow.style.display = 'none';
  });

  sendBtn.addEventListener('click', async () => {

    const message = userInput.value.trim();
    if (message) {
      const userMsg = document.createElement('p');
      userMsg.classList.add('user-msg');
      userMsg.textContent = message;
      chatBody.appendChild(userMsg);
      chatBody.scrollTop = chatBody.scrollHeight;
      userInput.value = '';

      try {
        const response = await fetch('http://localhost:5000/api/chatbot', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message })
        });

        const data = await response.json();

        const botMsg = document.createElement('p');
        botMsg.classList.add('bot-msg');
        botMsg.innerHTML = data.response;
        chatBody.appendChild(botMsg);
        chatBody.scrollTop = chatBody.scrollHeight;

        if (data.music) {


          if(currentAudio){
            currentAudio.pause();
            currentAudio.currentTime = 0;
          }

          currentAudio = document.createElement('audio');
          currentAudio.src = `http://localhost:5000/api/music/${encodeURIComponent(data.music)}`;
          currentAudio.controls = true;
          currentAudio.autoplay = true;
          currentAudio.style.marginTop = '10px';
          
          chatBody.appendChild(currentAudio);
          chatBody.scrollTop = chatBody.scrollHeight;
        }

        //YOUTUBE
        if(data.youtube_id){

          const iframe = document.createElement('iframe');
          iframe.width = "250"; 
          iframe.height = "170";
          iframe.src = `https://www.youtube.com/embed/${data.youtube_id}`;
          iframe.frameBorder = "0";
          iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
          iframe.allowFullscreen = true;
          iframe.style.marginTop = '10px';

          chatBody.appendChild(iframe);
          chatBody.scrollTop = chatBody.scrollHeight;
        }

      } catch (error) {
        console.error('Error al contactar al chatbot:', error);
      }
    }
  });

  userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      sendBtn.click();
    }
  });
});
