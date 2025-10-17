// /js/login.js
document.addEventListener('DOMContentLoaded', () => {
  // ====== CONFIG ======
  const API_BASE = 'https://lannister-news.com/users';

  // ====== AUTH STATE GLOBAL ======
  window.auth = window.auth || { isLoggedIn: false, userId: null };

  // ====== UI ELEMENTS ======
  const loginBtn        = document.querySelector('.btn-login');
  const loginOverlay    = document.getElementById('login-overlay');
  const loginCancel     = document.getElementById('login-cancel');
  const loginAccept     = document.getElementById('login-accept');
  const userSection     = document.getElementById('user-section');
  const userAvatar      = document.getElementById('user-avatar');
  const userMenu        = document.getElementById('user-menu');
  const logoutBtn       = document.getElementById('logout-btn');
  const editProfileBtn  = document.getElementById('edit-profile');
  const closePanelBtn   = document.getElementById('close-panel');
  const userPanel       = document.getElementById('user-panel');
  const modalSelector   = '.login-modal';
  const modalInicio     = document.querySelector('.sesion-modal');

  let currentUser = {}; // guardamos username y date_of_birth para el PUT

  // ====== HELPERS ======
  function getCookie(name) {
    const m = document.cookie.match('(^|;)\\s*' + name + '\\s*=\\s*([^;]+)');
    return m ? decodeURIComponent(m.pop()) : null;
  }

  async function fetchCSRF() {
    await fetch(`${API_BASE}/auth/csrf/`, { method: 'GET', credentials: 'include' });
    return getCookie('csrftoken');
  }

  async function apiLogin(username, password) {
    const csrftoken = await fetchCSRF();
    const res = await fetch(`${API_BASE}/auth/login/`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': csrftoken || ''
      },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg = data.detail || data.error || 'No se pudo iniciar sesión.';
      throw new Error(msg);
    }
    return data; // { id, username, email, is_authenticated: true }
  }

  async function apiMe() {
    const res = await fetch(`${API_BASE}/auth/me/`, { method: 'GET', credentials: 'include' });
    return res.json();
  }

  async function apiUserDetail(userId) {
    // /users/<id>/ → { id, username, first_name, last_name, email, date_of_birth, ... }
    const res = await fetch(`${API_BASE}/${userId}/`, { method: 'GET', credentials: 'include' });
    const data = await res.json();
    if (!res.ok) throw new Error('No se pudo obtener el perfil de usuario.');
    return data;
  }

  // PUT /users/<id>/ (PUT no parcial: hay que enviar TODOS los campos requeridos)
  async function apiUpdateUser(userId, payload) {
    const csrftoken = await fetchCSRF();
    const res = await fetch(`${API_BASE}/${userId}/`, {
      method: 'PUT',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': csrftoken || ''
      },
      body: JSON.stringify(payload)
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      // re-expone detalles para depurar
      const detail = typeof data === 'object' ? JSON.stringify(data) : (data?.detail || data?.error);
      throw new Error(detail || 'No se pudo actualizar el perfil.');
    }
    return data;
  }

  function actualizarAvatares(foto) {
    const base = '/assets';
    const defaultFoto = `${base}/userIconDefault.png`;
    const rutaFinal = foto ? `${base}/${foto}` : defaultFoto;


    const profileAvatar = document.getElementById('profile-avatar');
    const headerAvatar  = document.getElementById('user-avatar');
    if (profileAvatar) profileAvatar.src = rutaFinal;
    if (headerAvatar)  headerAvatar.src  = rutaFinal;
  }

  function clearLoginForm() {
    const u = document.getElementById('username');
    const p = document.getElementById('password');
    if (u) u.value = '';
    if (p) p.value = '';
  }

  function fillProfileForm(userObj) {
    const displayUser = document.getElementById('display-username');
    const emailInput  = document.getElementById('edit-email');
    const nameInput   = document.getElementById('edit-nombre');
    const lastInput   = document.getElementById('edit-apellido');

    if (displayUser) displayUser.textContent = userObj.username || '';
    if (emailInput)  emailInput.value = userObj.email || '';
    if (nameInput)   nameInput.value  = userObj.first_name || '';
    if (lastInput)   lastInput.value  = userObj.last_name || '';
  }

  function notifyPanel(text, type='info') {
    if (typeof showNotificationPanel === 'function') {
      showNotificationPanel(text, type, modalInicio);
    } else {
      alert(text);
    }
  }

  function logoutUI() {
    userSection.style.display = 'none';
    loginBtn.style.display = 'inline-block';
    userMenu.style.display = 'none';
    userPanel.style.display = 'none';
    currentUser = {};
    window.auth = { isLoggedIn: false, userId: null };
    document.dispatchEvent(new CustomEvent('auth:logout'));
    if (typeof showNotification === 'function') {
      showNotification('Has cerrado sesión correctamente.', 'success', modalSelector);
    }
  }

  // ====== UI EVENTS ======
  loginBtn.addEventListener('click', () => {
    if (window.auth?.isLoggedIn) {
      if (userMenu) userMenu.style.display = 'block';
      return;
    }
    loginOverlay.style.display = 'flex';
  });

  loginCancel.addEventListener('click', () => {
    loginOverlay.style.display = 'none';
    clearLoginForm();
  });

  if (closePanelBtn) {
    closePanelBtn.addEventListener('click', () => {
      userPanel.style.display = 'none';
    });
  }

  // ====== LOGIN FLOW ======
  loginAccept.addEventListener('click', async () => {
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();

    if (!username || !password) {
      if (typeof showNotification === 'function') {
        showNotification('Por favor ingresa usuario y contraseña.', 'error', modalSelector);
      }
      return;
    }

    try {
      // 1) Login (crea sessionid)
      const loginData = await apiLogin(username, password);

      // 2) Confirmar sesión
      const me = await apiMe();
      if (!me.is_authenticated) {
        if (typeof showNotification === 'function') {
          showNotification('No se pudo validar la sesión.', 'error', modalSelector);
        }
        return;
      }

      // 3) Traer detalle del usuario por ID y poblar el panel
      const userDetail = await apiUserDetail(loginData.id);

      // 4) Actualizar UI + estado global + evento
      if (typeof showNotificationPanel === 'function') {
        showNotificationPanel('Inicio de sesión exitoso', 'success', modalInicio);
      }

      currentUser = {
        id:            userDetail.id,
        usuario:       userDetail.username,         // necesario para PUT
        email:         userDetail.email,
        nombre:        userDetail.first_name || '',
        apellido:      userDetail.last_name  || '',
        date_of_birth: userDetail.date_of_birth || null, // necesario para PUT
        foto:          'userIconDefault.png'
      };

      window.auth = { isLoggedIn: true, userId: userDetail.id };
      document.dispatchEvent(new CustomEvent('auth:login', { detail: { ...window.auth } }));

      loginOverlay.style.display = 'none';
      loginBtn.style.display = 'none';
      userSection.style.display = 'flex';
      actualizarAvatares(currentUser.foto);
      fillProfileForm(userDetail);
      clearLoginForm();

      // Toggle menú avatar
      if (userAvatar) {
        userAvatar.onclick = () => {
          userMenu.style.display = (userMenu.style.display === 'block') ? 'none' : 'block';
        };
      }

      // Abrir panel perfil
      if (editProfileBtn) {
        editProfileBtn.addEventListener('click', () => {
          userMenu.style.display = 'none';
          userPanel.style.display = 'flex';
          fillProfileForm(userDetail);
          actualizarAvatares(currentUser.foto);
        });
      }

      // Tabs del panel
      document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
          document.getElementById(btn.dataset.tab).classList.add('active');
        });
      });

      // ====== GUARDAR PERFIL (PUT /users/<id>/) ======
      const profileForm = document.getElementById('profile-form');
      if (profileForm && !profileForm.dataset.bound) {
        profileForm.dataset.bound = 'true';
        profileForm.addEventListener('submit', async (e) => {
          e.preventDefault();

          const email     = document.getElementById('edit-email').value.trim();
          const firstName = document.getElementById('edit-nombre').value.trim();
          const lastName  = document.getElementById('edit-apellido').value.trim();

          const newPwd     = document.getElementById('edit-new-password')?.value || '';
          const confirmPwd = document.getElementById('edit-confirm-new-password')?.value || '';

          // Validación de password (opcional)
          if (newPwd || confirmPwd) {
            if (newPwd !== confirmPwd) {
              return notifyPanel('La nueva contraseña y su confirmación no coinciden.', 'error');
            }
            if (newPwd.length < 8) {
              return notifyPanel('La nueva contraseña debe tener al menos 8 caracteres.', 'error');
            }
          }

          // DRF PUT completo: username y date_of_birth son necesarios
          if (!currentUser.usuario) {
            return notifyPanel('Falta el nombre de usuario para actualizar el perfil.', 'error');
          }
          if (!currentUser.date_of_birth) {
            return notifyPanel('Tu perfil no tiene fecha de nacimiento registrada. Pídela al backend o agrega un campo en el formulario antes de guardar.', 'error');
          }

          // Si quisieras permitir editar DOB desde el UI:
          // const dobInput = document.getElementById('edit-dob')?.value; // 'YYYY-MM-DD'
          // const dob = dobInput || currentUser.date_of_birth;

          const payload = {
            username:      currentUser.usuario,       // requerido por el modelo
            email:         email,
            first_name:    firstName,
            last_name:     lastName,
            date_of_birth: currentUser.date_of_birth  // requerido por tu serializer (18+)
          };

          if (newPwd) {
            payload.password = newPwd; // el serializer hará set_password
          }

          const btnSave = document.getElementById('save-profile-btn');
          if (btnSave) {
            btnSave.disabled = true;
            btnSave.setAttribute('aria-busy', 'true');
          }

          try {
            const updated = await apiUpdateUser(currentUser.id, payload);

            // Refrescar estado/UI con lo que vuelva del backend
            currentUser.email         = updated.email;
            currentUser.nombre        = updated.first_name;
            currentUser.apellido      = updated.last_name;
            currentUser.usuario       = updated.username;
            currentUser.date_of_birth = updated.date_of_birth || currentUser.date_of_birth;

            fillProfileForm(updated);

            // Limpiar passwords
            const cur = document.getElementById('edit-current-password');
            const n1  = document.getElementById('edit-new-password');
            const n2  = document.getElementById('edit-confirm-new-password');
            if (cur) cur.value = '';
            if (n1)  n1.value  = '';
            if (n2)  n2.value  = '';

            notifyPanel('Perfil actualizado con éxito.', 'success');
          } catch (err) {
            // muestra detalle que vino del backend si existe
            notifyPanel(`No se pudo actualizar: ${err.message}`, 'error');
          } finally {
            if (btnSave) {
              btnSave.disabled = false;
              btnSave.removeAttribute('aria-busy');
            }
          }
        });
      }

      // Logout (solo UI por ahora)
      if (logoutBtn) logoutBtn.onclick = () => logoutUI();

    } catch (err) {
      console.error('Login error:', err);
      const msg = err?.message || 'Error al conectar con el servidor.';
      if (typeof showNotification === 'function') {
        showNotification(msg, 'error', modalSelector);
      } else {
        alert(msg);
      }
    }
  });

  // ====== BOOTSTRAP DE SESIÓN AL CARGAR ======
  (async function bootstrapLoginUI() {
    try {
      const me = await apiMe();
      if (me?.is_authenticated) {
        window.auth = { isLoggedIn: true, userId: me.id };
        document.dispatchEvent(new CustomEvent('auth:bootstrap', { detail: { ...window.auth } }));
      } else {
        window.auth = { isLoggedIn: false, userId: null };
        document.dispatchEvent(new CustomEvent('auth:bootstrap', { detail: { ...window.auth } }));
      }
    } catch {
      window.auth = { isLoggedIn: false, userId: null };
      document.dispatchEvent(new CustomEvent('auth:bootstrap', { detail: { ...window.auth } }));
    }
  })();
});
