document.addEventListener('DOMContentLoaded', () => {
    const loginBtn = document.querySelector('.btn-login');
    const loginOverlay = document.getElementById('login-overlay');
    const loginCancel = document.getElementById('login-cancel');
    const loginAccept = document.getElementById('login-accept');
    const userSection = document.getElementById('user-section');
    const userAvatar = document.getElementById('user-avatar');
    const userMenu = document.getElementById('user-menu');
    const logoutBtn = document.getElementById('logout-btn');
    const editProfileBtn = document.getElementById('edit-profile');
    const closePanelBtn = document.getElementById('close-panel');
    const userPanel = document.getElementById('user-panel');

    const modalSelector = ('.login-modal');
    let currentUser = {};

    const modalInicio = document.querySelector('.sesion-modal');


    //ACtualizar fotos
    function actualizarAvatares(foto){
        const defaultFoto = '/fotos/userIconDefault.png';
        const rutaFinal = foto ? `/fotos/${foto}` : defaultFoto;

        document.getElementById('profile-avatar').src = rutaFinal;
        document.getElementById('user-avatar').src = rutaFinal;
    }


    // Mostrar modal login
    loginBtn.addEventListener('click', () => {
        loginOverlay.style.display = 'flex';
    });

    // Cerrar modal login
    loginCancel.addEventListener('click', () => {
        loginOverlay.style.display = 'none';
        clearLoginForm();
    });

    // Botón cerrar panel (X)
    if (closePanelBtn) {
        closePanelBtn.addEventListener('click', () => {
            userPanel.style.display = 'none';
        });
    }

    // Login
    loginAccept.addEventListener('click', async () => {
        const usuario = document.getElementById('username').value.trim();
        const contrasena = document.getElementById('password').value.trim();

        if (!usuario || !contrasena) {
            showNotification('Por favor ingresa usuario y contraseña.', 'error', modalSelector);
            return;
        }

        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ usuario, contrasena })
            });

            const data = await response.json();

            if (response.ok) {

                showNotificationPanel('Inicio de sesión exitoso', 'success', modalInicio);


                currentUser = {
                    usuario: data.usuario,
                    email: data.email,
                    nombre: data.nombre,
                    apellido: data.apellido,
                    telefono: data.telefono,
                    foto: data.foto || 'userIconDefault.png'
                };

                document.getElementById('display-username').textContent = currentUser.usuario || '';

                loginOverlay.style.display = 'none';
                loginBtn.style.display = 'none';

                userSection.style.display = 'flex';
                
                actualizarAvatares(currentUser.foto);


                clearLoginForm();

                // Toggle menú
                userAvatar.onclick = () => {
                    userMenu.style.display = (userMenu.style.display === 'block') ? 'none' : 'block';
                };


                //verificar si es admin
                if(currentUser.usuario === "AdministradorABS"){
                    admin();
                }

                // Editar perfil
                editProfileBtn.addEventListener('click', () => {
                    userMenu.style.display = 'none';
                    userPanel.style.display = 'flex';

                    document.getElementById('edit-email').value = currentUser.email || '';
                    document.getElementById('edit-nombre').value = currentUser.nombre || '';
                    document.getElementById('edit-apellido').value = currentUser.apellido || '';
                    document.getElementById('edit-telefono').value = currentUser.telefono || '';

                    actualizarAvatares(currentUser.foto);

                });

                // Cambio de tabs
                document.querySelectorAll('.tab-btn').forEach(btn => {
                    btn.addEventListener('click', () => {
                        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                        btn.classList.add('active');

                        document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
                        document.getElementById(btn.dataset.tab).classList.add('active');
                    });
                });

                // Visualización de avatar local
                document.getElementById('avatar-upload').addEventListener('change', (e) => {

                    const file = e.target.files[0];
                    
                    if (file) {
                        const reader = new FileReader();
                        reader.onload = () => {
                            actualizarAvatares(reader.result);
                            
                        };
                        reader.readAsDataURL(file);
                    }
                });

                // Guardar cambios de perfil
                document.getElementById('profile-form').addEventListener('submit', async (e) => {
                    e.preventDefault();


                    const currentPass = document.getElementById('edit-current-password').value;

                    if(!currentPass){
                        showNotificationPanel('Debes ingresar tu contraseña actual para guardar cambios.', 'error', modalInicio);
                        return;
                    }


                    const formData = new FormData();
                    formData.append('usuario', currentUser.usuario);
                    formData.append('email', document.getElementById('edit-email').value);
                    formData.append('nombre', document.getElementById('edit-nombre').value);
                    formData.append('apellido', document.getElementById('edit-apellido').value);
                    formData.append('telefono', document.getElementById('edit-telefono').value);

                    //Password
                    formData.append('currentPassword', document.getElementById('edit-current-password').value);
                    formData.append('newPassword', document.getElementById('edit-new-password').value);
                    formData.append('confirmNewPassword', document.getElementById('edit-confirm-new-password').value);


                    const foto = document.getElementById('avatar-upload').files[0];
                    if (foto) {
                        formData.append('foto', foto);
                    }

                    try {
                        const response = await fetch('/api/editar-perfil', {
                            method: 'POST',
                            body: formData
                        });

                        const data = await response.json();

                        if (response.ok) {
                            showNotificationPanel('Perfil actualizado', 'success', modalInicio);
                            currentUser = data.usuario;

                            if (currentUser.foto) {
                                actualizarAvatares(currentUser.foto);
                            }
                        } else {
                            showNotificationPanel('Error al actualizar perfil', 'error', modalInicio);
                        }

                    } catch (error) {
                       
                        showNotification('Error de conexión con el servidor.', 'error', modalSelector);
                    }
                });

                //Lógica de favoritos

                // Logout
                logoutBtn.onclick = () => {
                    logoutUser();
                };

            } else {
                showNotification(data.error || 'Error en el inicio de sesión', 'error', modalSelector);
            }

        } catch (error) {
            console.error('Error en login:', error);
            showNotification('Error al conectar con el servidor.', 'error', modalSelector);
        }
    });



    // Funciones auxiliares
    function clearLoginForm() {
        document.getElementById('username').value = '';
        document.getElementById('password').value = '';
    }


    function logoutUser() {
        userSection.style.display = 'none';
        loginBtn.style.display = 'inline-block';
        userMenu.style.display = 'none';
        userPanel.style.display = 'none';
        currentUser = {};
        removeAdminUI();
        showNotification('Has cerrado sesión correctamente.', 'success', modalSelector);
    }

    function admin(){

        const pqrsfTabBtn = document.getElementById('pqrsf-tab-btn');
        const estadisticasTabBtn = document.getElementById('estadisticas-tab-btn');
        const noticiasTabBtn = document.getElementById('noticias-tab-btn');
        const usuariosTabBtn = document.getElementById('usuarios-tab-btn');

        if (pqrsfTabBtn) pqrsfTabBtn.style.display = 'block';
        if (estadisticasTabBtn) estadisticasTabBtn.style.display = 'block';
        if(noticiasTabBtn) noticiasTabBtn.style.display = 'block';
        if(usuariosTabBtn) usuariosTabBtn.style.display = 'block';

    }

    function removeAdminUI(){
        const pqrsfTabBtn = document.getElementById('pqrsf-tab-btn');
        const estadisticasTabBtn = document.getElementById('estadisticas-tab-btn');
        const noticiasTabBtn = document.getElementById('noticias-tab-btn');
        const usuariosTabBtn = document.getElementById('usuarios-tab-btn');


        if (pqrsfTabBtn) pqrsfTabBtn.style.display = 'none';
        if (estadisticasTabBtn) estadisticasTabBtn.style.display = 'none';
        if (noticiasTabBtn) noticiasTabBtn.style.display = 'none';
        if (usuariosTabBtn) usuariosTabBtn.style.display = 'none';
    }
});
