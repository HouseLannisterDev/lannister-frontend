// === utils comunes ===
const API_BASE = 'https://lannister-news.com/users';

function getCookie(name) {
  const m = document.cookie.match('(^|;)\\s*' + name + '\\s*=\\s*([^;]+)');
  return m ? decodeURIComponent(m.pop()) : null;
}

async function fetchCSRF() {
  // Pide a Django que emita/renueve el cookie "csrftoken"
  await fetch(`${API_BASE}/auth/csrf/`, { method: 'GET', credentials: 'include' });
  const token = getCookie('csrftoken');

  // Django suele emitir 64 chars; con >=32 evitamos falsos negativos
  if (!token || token.length < 32) {
    throw new Error('No se pudo obtener el token CSRF.');
  }
  return token;
}

document.addEventListener('DOMContentLoaded', () => {
  const loginOverlay      = document.getElementById('login-overlay');
  const registerOverlay   = document.getElementById('register-overlay');

  const btnLogin          = document.querySelector('.btn-login');
  const btnLoginCancel    = document.getElementById('login-cancel');
  const btnRegisterCancel = document.getElementById('register-cancel');
  const linkRegister      = document.getElementById('open-register');
  const btnRegister       = document.getElementById('register-accept');

  // Abrir/Cerrar login/registro
  btnLogin?.addEventListener('click', () => { loginOverlay.style.display = 'flex'; });
  btnLoginCancel?.addEventListener('click', () => { loginOverlay.style.display = 'none'; clearRegisterForm(); });
  linkRegister?.addEventListener('click', (e) => {
    e.preventDefault();
    loginOverlay.style.display = 'none';
    registerOverlay.style.display = 'flex';
  });
  btnRegisterCancel?.addEventListener('click', () => { registerOverlay.style.display = 'none'; clearRegisterForm(); });

  // Mostrar/Ocultar contraseñas
  const toggle = document.getElementById('toggle-passwords');
  if (toggle) {
    toggle.addEventListener('change', (e) => {
      const show = e.target.checked;
      ['reg-password', 'reg-confirm-password'].forEach(id => {
        const f = document.getElementById(id);
        if (f) f.type = show ? 'text' : 'password';
      });
    });
  }

  // ===== Envío de registro =====
  btnRegister?.addEventListener('click', async () => {
    const usuario    = (document.getElementById('reg-username') || {}).value?.trim() || '';
    const email      = document.getElementById('reg-email').value.trim();
    const nombre     = document.getElementById('reg-firstname').value.trim();
    const apellido   = document.getElementById('reg-lastname').value.trim();
    const birthday   = document.getElementById('reg-birthday').value.trim(); // YYYY-MM-DD
    const contrasena = document.getElementById('reg-password').value.trim();
    const confirmar  = document.getElementById('reg-confirm-password').value.trim();

    const modalSelector = '.register-modal';

    // Validaciones
    if (!usuario || !email || !nombre || !apellido || !birthday || !contrasena || !confirmar) {
      showNotification('Por favor completa todos los campos.', 'error', modalSelector); return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) { showNotification('Correo electrónico no válido.', 'error', modalSelector); return; }
    if (contrasena !== confirmar) { showNotification('Las contraseñas no coinciden.', 'error', modalSelector); return; }
    if (!document.getElementById('accept-terms')?.checked) { showNotification('Debes aceptar los términos y condiciones.', 'error', modalSelector); return; }
    const nombreRegex = /^[A-Za-zÁÉÍÓÚÑáéíóúñ\s]+$/;
    if (!nombreRegex.test(nombre) || !nombreRegex.test(apellido)) { showNotification('El nombre y apellido solo deben tener letras.', 'error', modalSelector); return; }
    const birthdayRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!birthdayRegex.test(birthday)) { showNotification('El cumpleaños debe tener el formato YYYY-MM-DD.', 'error', modalSelector); return; }

    const payload = {
      username:      usuario,
      email:         email,
      first_name:    nombre,
      last_name:     apellido,
      password:      contrasena,
      date_of_birth: birthday
    };

    btnRegister.disabled = true;

    try {
      // 1) Obtener token CSRF de forma explícita
      const csrftoken = await fetchCSRF();  // 👈 igual que en login

      // 2) POST de registro con credenciales + token
      const resp = await fetch(`${API_BASE}/`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrftoken,
          'X-Requested-With': 'XMLHttpRequest' // opcional, pero útil en algunos setups
        },
        body: JSON.stringify(payload)
      });

      const text = await resp.text();
      let data = null;
      try { data = text ? JSON.parse(text) : null; } catch {}

      if (resp.ok) {
        const msg = (data?.message || data?.detail || 'Registro exitoso');
        showNotification(msg, 'success', modalSelector);
        setTimeout(() => { registerOverlay.style.display = 'none'; }, 2000);
        clearRegisterForm();
      } else {
        const serverMsg =
          data?.error || data?.detail || data?.message || text || 'Error en el registro';

        if (/unique|exist/i.test(serverMsg)) {
          showNotification('Usuario o correo ya registrado. Prueba con otro.', 'error', modalSelector);
        } else {
          showNotification(serverMsg, 'error', modalSelector);
        }
      }
    } catch (err) {
      console.error('[register] error:', err);
      showNotification(err.message || 'Error al conectar con el servidor.', 'error', modalSelector);
    } finally {
      btnRegister.disabled = false;
    }
  });
});

// Limpiar formulario
function clearRegisterForm() {
  [
    'reg-username','reg-email','reg-firstname','reg-lastname',
    'reg-birthday','reg-password','reg-confirm-password'
  ].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });

  const toggle = document.getElementById('toggle-passwords');
  if (toggle) toggle.checked = false;

  const pwd  = document.getElementById('reg-password');
  const pwd2 = document.getElementById('reg-confirm-password');
  if (pwd)  pwd.type  = 'password';
  if (pwd2) pwd2.type = 'password';
}
