// controlador.js (Opción A - Backend Django)
document.addEventListener('DOMContentLoaded', () => {
  const container   = document.getElementById('news-container');
  const pagination  = document.getElementById('pagination');
  const sideMenu    = document.getElementById('side-menu');
  const pageSize    = 10;

  // ==== OPCIÓN A: BACKEND DJANGO ====
  const API_BASE     = 'http://127.0.0.1:8000'; // tu backend local
  const USE_BACKEND  = true;

  // Mapea el nombre visible del menú → categoría exacta en la DB
  const CATEGORY_MAP = {
    'deportes':    'Deportes',
    'judiciales':  'Judiciales',
    'animales':    'Animales',
    'moda':        'Moda',
    'tecnologia':  'Tecnología',
    'tecnología':  'Tecnología',
  };

  let noticiasData    = [];
  let currentPage     = 1;
  let currentCategory = ''; // nombre "real" que se mandará al backend
  let totalPages      = 1;

  // ========= Helpers =========
  function visibleToRealCategory(visible) {
    if (!visible) return '';
    const key = String(visible).trim().toLowerCase();
    return CATEGORY_MAP[key] || visible.trim();
  }

  function normalizeItem(n) {
    return {
      title:         n.title || n.titulo || 'Sin título',
      description:   n.description || n.descripcion || '',
      url:           n.url || '#',
      source_domain: n.source_domain || n.source || '',
      category:      n.category || n.categoria || '',
      scraped_at:    n.scraped_at || null,
      date_publish:  n.date_publish || null,
    };
  }

  function formatDateMaybe(d) {
    if (!d) return '';
    try {
      const dt = new Date(d);
      if (isNaN(dt)) return '';
      return dt.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: '2-digit' });
    } catch { return ''; }
  }

function createCard(n) {
  const card = document.createElement('div');
  card.className = 'news-card';

  const h2 = document.createElement('h2');
  const a  = document.createElement('a');
  a.textContent = n.title;
  a.href = n.url || '#';
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  h2.appendChild(a);

  const p = document.createElement('p');
  p.textContent = (n.description || '').slice(0, 400);

  const meta = document.createElement('div');
  meta.className = 'news-meta';
  const source = n.source_domain ? ` · ${n.source_domain}` : '';
  const when = formatDateMaybe(n.date_publish) || formatDateMaybe(n.scraped_at);
  meta.textContent = `${n.category || ''}${source}${when ? ' · ' + when : ''}`;

  const actions = document.createElement('div');
  actions.className = 'news-actions';

  const link = document.createElement('a');
  link.textContent = 'Abrir noticia ↗';
  link.href = n.url || '#';
  link.target = '_blank';
  link.rel = 'noopener noreferrer';

  actions.appendChild(link);

  // Botón guardar flotante (esquina inferior derecha)
  const saveBtn = document.createElement('button');
  saveBtn.className = 'save-btn';
  saveBtn.setAttribute('type', 'button');
  saveBtn.setAttribute('title', 'Guardar');
  saveBtn.setAttribute('aria-pressed', 'false');

  // Icono bookmark (vacío → se rellena con .saved)
  saveBtn.innerHTML = `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1z"/>
    </svg>
  `;

  card.appendChild(h2);
  card.appendChild(p);
  card.appendChild(meta);
  card.appendChild(actions);
  card.appendChild(saveBtn); // importante: después para que quede por encima

  return card;
}


  function createPageElement(items) {
    const pageEl = document.createElement('div');
    pageEl.className = 'news-page';
    items.forEach(item => pageEl.appendChild(createCard(normalizeItem(item))));
    return pageEl;
  }

  function renderPage(page) {
    const start = (page - 1) * pageSize;
    const end   = start + pageSize;
    const pageItems = noticiasData.slice(start, end);

    const nextPageEl = createPageElement(pageItems);

    Array.from(container.querySelectorAll('.news-page')).forEach(el => el.remove());
    container.innerHTML = '';
    container.appendChild(nextPageEl);

    requestAnimationFrame(() => nextPageEl.classList.add('show'));
  }

  function renderPagination(total) {
    pagination.innerHTML = '';
    if (total <= 1) return;

    const makeBtn = (label, page, disabled=false, isActive=false) => {
      const btn = document.createElement('button');
      btn.textContent = label;
      if (disabled) btn.disabled = true;
      if (isActive) btn.classList.add('active');
      btn.addEventListener('click', () => {
        if (page === currentPage || disabled) return;
        currentPage = page;
        renderPage(currentPage);
        renderPagination(totalPages);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
      return btn;
    };

    pagination.appendChild(makeBtn('«', Math.max(1, currentPage - 1), currentPage === 1));

    const windowSize = 3;
    const start = Math.max(1, currentPage - windowSize);
    const end   = Math.min(total, currentPage + windowSize);

    if (start > 1) {
      pagination.appendChild(makeBtn('1', 1, false, currentPage === 1));
      if (start > 2) {
        const span = document.createElement('span');
        span.className = 'spacer';
        span.textContent = '…';
        pagination.appendChild(span);
      }
    }

    for (let i = start; i <= end; i++) {
      pagination.appendChild(makeBtn(String(i), i, false, i === currentPage));
    }

    if (end < total) {
      if (end < total - 1) {
        const span = document.createElement('span');
        span.className = 'spacer';
        span.textContent = '…';
        pagination.appendChild(span);
      }
      pagination.appendChild(makeBtn(String(total), total, false, currentPage === total));
    }

    pagination.appendChild(makeBtn('»', Math.min(total, currentPage + 1), currentPage === total));
  }

  function setLoading(isLoading) {
    if (isLoading) {
      container.innerHTML = `<div class="loading">Cargando noticias…</div>`;
      pagination.innerHTML = '';
    }
  }

  // ==== FETCHERS ====
  async function fetchFromBackend(categoryReal) {
    const qs = new URLSearchParams();
    if (categoryReal) qs.set('q', categoryReal);
    qs.set('limit', '200');
    const url = `${API_BASE.replace(/\/$/, '')}/news/?${qs.toString()}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  }

  async function fetchRandomFromBackend() {
    const qs = new URLSearchParams();
    qs.set('limit', '200'); // muestra bastante para paginar en front
    const url = `${API_BASE.replace(/\/$/, '')}/news/random/?${qs.toString()}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  }

  async function loadAndRender(visibleCategory = '') {
    currentCategory = visibleToRealCategory(visibleCategory);
    setLoading(true);
    try {
      let list = [];
      if (USE_BACKEND) {
        // Si no hay categoría elegida, carga aleatorias
        list = currentCategory
          ? await fetchFromBackend(currentCategory)
          : await fetchRandomFromBackend();
      }

      noticiasData = Array.isArray(list) ? list.map(normalizeItem) : [];
      if (noticiasData.length === 0) {
        container.innerHTML = `<div class="loading">Aún no hay noticias para esta selección. Prueba otra categoría.</div>`;
        pagination.innerHTML = '';
        return;
      }

      totalPages   = Math.max(1, Math.ceil(noticiasData.length / pageSize));
      currentPage  = 1;
      renderPage(currentPage);
      renderPagination(totalPages);
    } catch (err) {
      container.innerHTML = `<div class="loading">Error cargando noticias: ${escapeHTML(err.message)}</div>`;
      console.error(err);
    }
  }

  // ==== Click en categorías del menú lateral ====
  sideMenu?.querySelectorAll('ul li').forEach(li => {
    li.style.cursor = 'pointer';
    li.addEventListener('click', () => {
      const visible = (li.textContent || '').trim();
      loadAndRender(visible);
      sideMenu.classList.remove('open');
    });
  });

  // Carga inicial: SIN categoría → noticias aleatorias
  loadAndRender('');
});

/* Sanitizador básico */
function escapeHTML(s) {
  return String(s)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
