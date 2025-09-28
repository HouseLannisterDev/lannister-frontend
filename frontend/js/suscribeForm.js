document.addEventListener('DOMContentLoaded', () => {
    const subscribeBtn = document.querySelector('.btn-subscribe');
    const overlay = document.getElementById('subscribe-overlay');
    const acceptBtn = document.getElementById('subscribe-accept');
    const cancelBtn = document.getElementById('subscribe-cancel');
    const emailInput = document.getElementById('email-input');

    // Mostrar overlay al hacer clic en el botón de suscripción
    subscribeBtn.addEventListener('click', () => {
        overlay.style.display = 'flex';
    });

    // Cerrar overlay al hacer clic en cancelar
    cancelBtn.addEventListener('click', () => {
        overlay.style.display = 'none';
        emailInput.value = '';
    });

    // Enviar datos de suscripción -> abrir Google Form pre-rellenado
    acceptBtn.addEventListener('click', () => {
        const email = emailInput.value.trim();

        if (!email || !email.includes('@')) {
            showNotification('Por favor ingresa un correo válido.', 'error');
            return;
        }

        try {
            // ID del campo en el formulario de Google
            const ENTRY_ID = '1356440258';
            const baseURL = 'https://docs.google.com/forms/d/e/1FAIpQLSdLlPeqlNCqezQ8wM-hNCQLPP6Sc9zWkYHNIXoMSx9Q3BzRbA/viewform';

            // Construir URL con email pre-rellenado
            const prefillURL = `${baseURL}?usp=pp_url&entry.${ENTRY_ID}=${encodeURIComponent(email)}`;

            // Abrir en nueva pestaña
            window.open(prefillURL, '_blank');

            // Cerrar overlay y limpiar input
            overlay.style.display = 'none';
            emailInput.value = '';

            showNotification('Abriendo el formulario de suscripción…');
        } catch (error) {
            console.error('Error al abrir el formulario:', error);
            showNotification('Ocurrió un error al abrir el formulario.', 'error');
        }
    });
});
