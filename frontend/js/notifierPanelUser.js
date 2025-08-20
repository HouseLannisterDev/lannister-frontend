function showNotificationPanel(message, type, modalElement) {
    if (!modalElement) return;

    // Busca si ya hay un contenedor de mensaje
    let notification = modalElement.querySelector('.subscribe-message');

    // Si no existe, lo creamos
    if (!notification) {
        notification = document.createElement('div');
        notification.classList.add('subscribe-message');
        modalElement.insertBefore(notification, modalElement.firstChild);
    }

    // Resetear clases y agregar el tipo
    notification.className = 'subscribe-message ' + type;

    // Asignar mensaje y mostrar
    notification.textContent = message;
    notification.style.display = 'block';

    // Ocultar después de 3 segundos
    setTimeout(() => {
        notification.style.display = 'none';
    }, 3000);
}



//CONFIRMACIÓN ELIMINACION USUARIO MENSAJE

function showConfirmationPanel(message, modalElement, onConfirm, onCancel){

    if(!modalElement) return;

    //Crear contenedor o usar para mensaje
    let notificationDelete = modalElement.querySelector('.subscribe-message');

    if(!notificationDelete){

        notificationDelete = document.createElement('div');
        notificationDelete.classList.add('subscribe-message');
        modalElement.insertBefore(notificationDelete, modalElement.firstChild);
    }

    //limpiar contenido
    notificationDelete.innerHTML = '';


    //mensaje
    const msg = document.createElement('p');
    msg.textContent = message;
    notificationDelete.appendChild(msg);

    //Si o no
    const btnYes = document.createElement('button');
    btnYes.textContent = 'SI';
    btnYes.style.marginRight = '10px';

    const btnNo = document.createElement('button');
    btnNo.textContent = 'NO';

    notificationDelete.appendChild(btnYes);
    notificationDelete.appendChild(btnNo);

    //Mostrar contenedor
    notificationDelete.style.display = 'block';

    //eventos botones
    btnYes.onclick = () => {
        notificationDelete.style.display = 'none';
        onConfirm();
    };

    btnNo.onclick = () => {
        notificationDelete.style.display = 'none';
        if(onCancel) onCancel();
    };

    setTimeout(() => {
        notificationDelete.style.display = 'none';
    }, 5000);


}