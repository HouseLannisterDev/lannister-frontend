document.addEventListener('DOMContentLoaded', () => {
    
    const datetimeElement = document.getElementById('datetime');

    function updateDateTime() {
        const now = new Date();

        const options = { weekday: 'long' };
        const dayName = now.toLocaleDateString('es-ES', options);
        const date = now.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
        const time = now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

        datetimeElement.textContent = `${capitalize(dayName)}, ${date} / ${time}`;
    }

    function capitalize(text) {
        return text.charAt(0).toUpperCase() + text.slice(1);
    }

    updateDateTime();
    setInterval(updateDateTime, 60000); // Actualiza cada minuto
});
