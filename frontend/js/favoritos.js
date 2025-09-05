document.addEventListener('DOMContentLoaded', () => {
  // Simulación de sesión: cambiar a true cuando integres auth real
  let isLoggedIn = false;

  // Delegación: escucha clicks en todo el documento
  document.body.addEventListener('click', (e) => {
    const btn = e.target.closest('.save-btn');
    if (!btn) return;

    // Si no hay sesión → abrir flujo de login
    if (!isLoggedIn) {
      const loginBtn = document.querySelector('.btn-login');
      if (loginBtn) {
        loginBtn.click(); // usa tu comportamiento ya implementado
      } else {
        alert('Debes iniciar sesión para guardar esta noticia 🔒');
      }
      return;
    }

    // Con sesión → alterna estado visual
    btn.classList.toggle('saved');
    // Marca accesible
    const pressed = btn.classList.contains('saved');
    btn.setAttribute('aria-pressed', pressed ? 'true' : 'false');

    // Aquí luego podrás llamar a tu API para guardar/desguardar en perfil
    // fetch('/api/saved', { method: pressed ? 'POST' : 'DELETE', body: ... })
  });
});
