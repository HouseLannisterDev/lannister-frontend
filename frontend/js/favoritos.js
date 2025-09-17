// /js/favoritos.js
document.addEventListener('DOMContentLoaded', () => {
  const API_BASE = 'http://127.0.0.1:8000/users';
  const PAGE_SIZE = 5;

  // ====================== API helpers ======================
  async function fetchCSRF() {
    await fetch(`${API_BASE}/auth/csrf/`, { method: 'GET', credentials: 'include' });
    const m = document.cookie.match('(^|;)\\s*csrftoken\\s*=\\s*([^;]+)');
    return m ? decodeURIComponent(m.pop()) : '';
  }

  async function apiFavoriteCreate(url) {
    const csrftoken = await fetchCSRF();
    const res = await fetch(`${API_BASE}/favorites/`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', 'X-CSRFToken': csrftoken },
      body: JSON.stringify({ url })
    });
    if (!res.ok) throw new Error((await res.json().catch(()=>({}))).detail || `HTTP ${res.status}`);
    return res.json(); // {id, url, ...}
  }

  async function apiFavoriteList() {
    const res = await fetch(`${API_BASE}/favorites/`, { credentials: 'include' });
    if (res.status === 403) return []; // No logeado
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json(); // array
  }

  async function apiFavoriteDeleteById(id) {
    const csrftoken = await fetchCSRF();
    const res = await fetch(`${API_BASE}/favorites/${id}/`, {
      method: 'DELETE',
      credentials: 'include',
      headers: { 'X-CSRFToken': csrftoken }
    });
    if (!res.ok) throw new Error((await res.json().catch(()=>({}))).detail || `HTTP ${res.status}`);
  }

  async function apiFavoriteDeleteByUrl(url) {
    const csrftoken = await fetchCSRF();
    const qs = new URLSearchParams({ url });
    const res = await fetch(`${API_BASE}/favorites/?${qs}`, {
      method: 'DELETE',
      credentials: 'include',
      headers: { 'X-CSRFToken': csrftoken }
    });
    if (!res.ok) throw new Error((await res.json().catch(()=>({}))).detail || `HTTP ${res.status}`);
  }

  // ====================== UI helpers ======================
  function getUrlFromButton(btn) {
    if (btn.dataset.url) return btn.dataset.url;
    const card  = btn.closest('.news-card');
    const linkA = card?.querySelector('h2 a');
    return linkA?.href || '';
  }

  function escapeHTML(s) {
    return String(s)
      .replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;')
      .replaceAll('"','&quot;').replaceAll("'",'&#039;');
  }

  // ====== FAVORITOS PANEL STATE ======
  let favState = { items: [], page: 1 }; // items viene del backend

  function totalFavPages() {
    return Math.max(1, Math.ceil(favState.items.length / PAGE_SIZE));
  }

  function renderFavoritesTab() {
    const tab = document.getElementById('favorites-tab');
    if (!tab) return;

    // Contenedor principal del tab
    const header = `
      <h3>Noticias Favoritas</h3>
    `;

    // Si no hay favoritos
    if (!favState.items.length) {
      tab.innerHTML = `
        ${header}
        <p class="info-text">Aún no tienes noticias guardadas.</p>
      `;
      return;
    }

    // Calcular ventana actual
    const pages = totalFavPages();
    favState.page = Math.min(Math.max(1, favState.page), pages);
    const start = (favState.page - 1) * PAGE_SIZE;
    const slice = favState.items.slice(start, start + PAGE_SIZE);

    // Lista ordenada (numera según índice global)
    const listHtml = `
      <ol class="favorites-list" start="${start + 1}">
        ${slice.map(it => `
          <li class="fav-row">
            <a href="${it.url}" target="_blank" rel="noopener">${escapeHTML(it.title || it.url)}</a>
            <button class="fav-remove" data-fav-id="${it.id ?? ''}" data-url="${it.url}" title="Quitar" aria-label="Quitar favorito">✕</button>
          </li>
        `).join('')}
      </ol>
    `;

    // Paginador simple
    const pager = `
      <div class="favorites-pager">
        <button class="fav-prev" ${favState.page === 1 ? 'disabled' : ''} aria-label="Anterior">‹</button>
        <span class="fav-page">${favState.page} / ${pages}</span>
        <button class="fav-next" ${favState.page === pages ? 'disabled' : ''} aria-label="Siguiente">›</button>
      </div>
    `;

    tab.innerHTML = `${header}${listHtml}${pager}`;
  }

  async function loadFavoritesAndRender() {
    if (!window.auth?.isLoggedIn) {
      favState = { items: [], page: 1 };
      renderFavoritesTab();
      return;
    }

    try {
      const items = await apiFavoriteList(); // [{id,url,title,...}]
      favState.items = items;

      // Sincroniza botones del grid (bookmark)
      const urlToId = new Map(items.map(i => [i.url, i.id]));
      document.querySelectorAll('.news-card .save-btn').forEach(btn => {
        const url = btn.dataset.url || getUrlFromButton(btn);
        const saved = urlToId.has(url);
        btn.classList.toggle('saved', saved);
        btn.setAttribute('aria-pressed', saved ? 'true' : 'false');
        if (saved) btn.dataset.favoriteId = urlToId.get(url);
        else delete btn.dataset.favoriteId;
      });

      renderFavoritesTab();
    } catch (e) {
      console.error('Error listando favoritos:', e);
      favState = { items: [], page: 1 };
      renderFavoritesTab();
    }
  }

  // ====================== EVENTOS: Bookmark en tarjetas ======================
  document.body.addEventListener('click', async (e) => {
    const btn = e.target.closest('.save-btn');
    if (!btn) return;

    // No logeado -> abre modal de login
    if (!window.auth?.isLoggedIn) {
      document.querySelector('.btn-login')?.click();
      return;
    }

    if (btn.dataset.loading === '1') return;
    btn.dataset.loading = '1';
    btn.setAttribute('aria-busy', 'true');

    const url = getUrlFromButton(btn);
    if (!url) {
      alert('No se encontró la URL de la noticia.');
      delete btn.dataset.loading;
      btn.removeAttribute('aria-busy');
      return;
    }

    const willSave = !btn.classList.contains('saved');

    try {
      if (willSave) {
        const created = await apiFavoriteCreate(url);
        if (created?.id) btn.dataset.favoriteId = created.id;
        btn.classList.add('saved');
        btn.setAttribute('aria-pressed', 'true');
      } else {
        if (btn.dataset.favoriteId) {
          await apiFavoriteDeleteById(btn.dataset.favoriteId);
          delete btn.dataset.favoriteId;
        } else {
          await apiFavoriteDeleteByUrl(url);
        }
        btn.classList.remove('saved');
        btn.setAttribute('aria-pressed', 'false');
      }
      // refresca panel
      await loadFavoritesAndRender();
    } catch (err) {
      alert(err?.message || 'Error al actualizar tus favoritos');
    } finally {
      delete btn.dataset.loading;
      btn.removeAttribute('aria-busy');
    }
  });

  // ====================== EVENTOS: Panel de favoritos ======================
  // Quitar favorito desde el listado (botón ✕)
  document.body.addEventListener('click', async (e) => {
    const rm = e.target.closest('.fav-remove');
    if (!rm) return;

    try {
      if (rm.dataset.favId) {
        await apiFavoriteDeleteById(rm.dataset.favId);
      } else if (rm.dataset.url) {
        await apiFavoriteDeleteByUrl(rm.dataset.url);
      }
      // Desmarcar también el botón del grid si existe
      const btn = Array.from(document.querySelectorAll('.news-card .save-btn'))
        .find(b => (b.dataset.url || getUrlFromButton(b)) === rm.dataset.url);
      if (btn) {
        btn.classList.remove('saved');
        delete btn.dataset.favoriteId;
        btn.setAttribute('aria-pressed','false');
      }
    } catch (err) {
      alert(err?.message || 'No se pudo quitar de favoritos');
    } finally {
      await loadFavoritesAndRender();
    }
  });

  // Paginador ‹ ›
  document.body.addEventListener('click', (e) => {
    if (e.target.closest('.fav-prev')) {
      favState.page = Math.max(1, favState.page - 1);
      renderFavoritesTab();
    }
    if (e.target.closest('.fav-next')) {
      favState.page = Math.min(totalFavPages(), favState.page + 1);
      renderFavoritesTab();
    }
  });

  // Cuando abren la pestaña “Favoritos” (usa tu id de tab)
  document.getElementById('favorites-tab')?.addEventListener('show', loadFavoritesAndRender);
  // Si tus tabs no emiten “show”, puedes enganchar el botón que abre esa pestaña:
  document.querySelector('[data-tab="favorites-tab"]')?.addEventListener('click', loadFavoritesAndRender);

  // Bootstrap / cambios de auth
  document.addEventListener('auth:login', loadFavoritesAndRender);
  document.addEventListener('auth:bootstrap', loadFavoritesAndRender);
  document.addEventListener('auth:logout', loadFavoritesAndRender);

  // Carga inicial silenciosa (por si ya hay sesión)
  loadFavoritesAndRender();
});
