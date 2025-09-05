document.addEventListener('DOMContentLoaded', () => {
    const overlay = document.getElementById('age-overlay');
    const btnYes = document.getElementById('btn-yes');
    const btnNo = document.getElementById('btn-no');

    btnYes.addEventListener('click', () => {
        overlay.style.display = 'none';
        document.body.classList.add('loaded');
        // Aquí lógica para noticias sin censura
    });

    btnNo.addEventListener('click', () => {
        window.location.href = 'https://www.google.com';
    });
});
