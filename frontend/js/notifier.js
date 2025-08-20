function showNotification(message, type = 'success', modalSelector = '.subscribe-modal') {
    
    let container = document.querySelector(`${modalSelector} .subscribe-message`);

    // si no existe contenedor lo creamos
    if (!container) {
        const modal = document.querySelector(modalSelector);
        container = document.createElement('div');
        container.className = 'subscribe-message';

        // si es el login-modal lo ponemos antes de los botones
        const botones = modal.querySelector('.subscribe-buttons');
        if (botones) {
            modal.insertBefore(container, botones);
        } else {
            // si no existe botones (por ejemplo en el panel de perfil)
            // lo insertamos arriba del formulario de perfil
            const form = modal.querySelector('form');
            if (form) {
                modal.insertBefore(container, form);
            } else {
                // como fallback lo mete al inicio del modal
                modal.prepend(container);
            }
        }
    }

    // contenido del mensaje
    container.textContent = message;
    container.className = `subscribe-message ${type}`;
    container.style.display = 'block';

    setTimeout(() => {
        container.style.display = 'none';
    }, 4000);
}
