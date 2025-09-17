// /js/autoTheme.js
(function () {
  const KEY = 'themeMode'; // 'auto' | 'light' | 'dark'
  const HTML = document.documentElement;

  // Media queries del sistema
  const mqDark    = window.matchMedia('(prefers-color-scheme: dark)');
  const mqNoPref  = window.matchMedia('(prefers-color-scheme: no-preference)');

  // --------- Helpers de estado ----------
  const readPref  = () => (localStorage.getItem(KEY) || 'auto');
  const savePref  = (m) => localStorage.setItem(KEY, m);

  function setButtonsUI(mode) {
    document.querySelectorAll('.theme-opt').forEach(btn => {
      const active = btn.dataset.theme === mode;
      btn.classList.toggle('active', active);
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
  }

  function applyAutoBySystem() {
    // Si el SO/navegador indica "no-preference" (modo automático del sistema),
    // no aplicamos inversión (modo claro efectivo).
    if (mqNoPref.matches) {
      HTML.classList.remove('dark-invert');
      return;
    }
    // Si el sistema está en dark → invertimos; en light → no
    if (mqDark.matches) HTML.classList.add('dark-invert');
    else HTML.classList.remove('dark-invert');
  }

  // Aplica el modo efectivo combinando preferencia del usuario + sistema
  function applyEffectiveTheme() {
    const pref = readPref();

    if (pref === 'dark') {
      HTML.classList.add('dark-invert');
      setButtonsUI('dark');
      return;
    }
    if (pref === 'light') {
      HTML.classList.remove('dark-invert');
      setButtonsUI('light');
      return;
    }
    // 'auto' → seguimos al sistema
    applyAutoBySystem();
    setButtonsUI('auto');
  }

  // --------- Listeners de sistema (cambios en caliente) ----------
  const onSystemChange = () => {
    if (readPref() === 'auto') applyEffectiveTheme();
  };

  mqDark.addEventListener?.('change', onSystemChange);
  mqNoPref.addEventListener?.('change', onSystemChange);
  if (!mqDark.addEventListener && mqDark.addListener) mqDark.addListener(onSystemChange);
  if (!mqNoPref.addEventListener && mqNoPref.addListener) mqNoPref.addListener(onSystemChange);

  // --------- Listeners de UI ----------
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.theme-opt');
    if (!btn) return;
    const mode = btn.dataset.theme; // 'auto' | 'light' | 'dark'
    savePref(mode);
    applyEffectiveTheme();
  });

  // --------- Bootstrap ----------
  (function init() {
    // Si nunca se eligió, deja 'auto' por defecto (no guardes nada si no quieres)
    setButtonsUI(readPref());
    applyEffectiveTheme();
  })();
})();
