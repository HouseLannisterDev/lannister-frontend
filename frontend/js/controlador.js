// /js/controlador.js  (Backend Django)
document.addEventListener('DOMContentLoaded', () => {
  const container   = document.getElementById('news-container');
  const pagination  = document.getElementById('pagination');
  const sideMenu    = document.getElementById('side-menu');
  const pageSize    = 10;

  const API_BASE     = 'https://api.lannister-news.com'; // backend de noticias
  const USE_BACKEND  = true;

  const CATEGORY_MAP = {
    'deportes':   'Deportes',
    'judiciales': 'Judiciales',
    'animales':   'Animales',
    'moda':       'Moda',
    'tecnología': 'Tecnología',
    // 'todos' se maneja con string vacío para pedir random
  };

  let noticiasData     = [];
  let currentPage      = 1;
  let currentCategory  = '';    // '' => random
  let currentSentiment = '';    // '', 'positive', 'neutral', 'negative'
  let totalPages       = 1;

  // ========= Helpers =========
  function visibleToRealCategory(visible) {
    if (!visible) return '';
    const key = String(visible).trim().toLowerCase();
    if (key === 'todos') return ''; // fuerza random
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
      sentiment:     n.sentiment || null,
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

  // Normaliza el sentimiento a: 'positive' | 'neutral' | 'negative' | null
  function getSentimentKind(s) {
    if (!s || typeof s !== 'object') return null;
    if ('positive' in s || 'neutral' in s || 'negative' in s) {
      const v = { positive: s.positive || 0, neutral: s.neutral || 0, negative: s.negative || 0 };
      let key = 'neutral', val = v.neutral;
      if (v.positive >= val && v.positive >= v.negative) { key = 'positive'; val = v.positive; }
      if (v.negative >= val && v.negative >= v.positive) { key = 'negative'; val = v.negative; }
      return key;
    }
    if ('label' in s) return String(s.label || '').toLowerCase();
    return null;
  }

  function pickSentimentLabel(s) {
    if (!s || typeof s !== 'object') return { label: 'Sin análisis', cls: 'sentiment-neu' };
    if ('positive' in s || 'neutral' in s || 'negative' in s) {
      const v = { positive: s.positive || 0, neutral: s.neutral || 0, negative: s.negative || 0 };
      let key = 'neutral', val = v.neutral;
      if (v.positive >= val && v.positive >= v.negative) { key = 'positive'; val = v.positive; }
      if (v.negative >= val && v.negative >= v.positive) { key = 'negative'; val = v.negative; }
      if (key === 'positive' && val > 0) return { label: 'Positiva', cls: 'sentiment-pos' };
      if (key === 'negative' && val > 0) return { label: 'Negativa', cls: 'sentiment-neg' };
      return { label: 'Neutral', cls: 'sentiment-neu' };
    }
    if ('label' in s) {
      const lbl = String(s.label || '').toLowerCase();
      if (lbl === 'positive') return { label: 'Positiva', cls: 'sentiment-pos' };
      if (lbl === 'negative') return { label: 'Negativa', cls: 'sentiment-neg' };
      if (lbl === 'neutral')  return { label: 'Neutral',  cls: 'sentiment-neu' };
    }
    return { label: 'Sin análisis', cls: 'sentiment-neu' };
  }

  // ===== Tarjeta =====
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
    const when   = formatDateMaybe(n.date_publish) || formatDateMaybe(n.scraped_at);
    meta.textContent = `${n.category || ''}${source}${when ? ' · ' + when : ''}`;

    const actions = document.createElement('div');
    actions.className = 'news-actions';

    const link = document.createElement('a');
    link.textContent = 'Abrir noticia ↗';
    link.href = n.url || '#';
    link.target = '_blank';
    link.rel = 'noopener noreferrer';

    const chip = document.createElement('span');
    const s = pickSentimentLabel(n.sentiment);
    chip.className = `sentiment-chip ${s.cls}`;
    chip.textContent = s.label;

    const saveBtn = document.createElement('button');
    saveBtn.className = 'save-btn';
    saveBtn.type = 'button';
    saveBtn.title = 'Guardar';
    saveBtn.setAttribute('aria-pressed', 'false');

    // >>> DATOS PARA favoritos.js <<<
    saveBtn.dataset.url      = n.url || '';
    saveBtn.dataset.title    = n.title || '';
    saveBtn.dataset.source   = n.source_domain || '';
    saveBtn.dataset.category = n.category || '';
    saveBtn.dataset.date     = n.date_publish || '';

    saveBtn.innerHTML = `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1z"/>
      </svg>
    `;

    actions.appendChild(link);
    actions.appendChild(chip);
    actions.appendChild(saveBtn);

    card.appendChild(h2);
    card.appendChild(p);
    card.appendChild(meta);
    card.appendChild(actions);

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
    qs.set('limit', '200');
    const url = `${API_BASE.replace(/\/$/, '')}/news/random/?${qs.toString()}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  }

  // Filtro por sentimiento (front)
  function filterBySentiment(list) {
    if (!currentSentiment) return list; // sin filtro
    return list.filter(item => getSentimentKind(item.sentiment) === currentSentiment);
  }

  async function loadAndRender(visibleCategory = '') {
    currentCategory = visibleToRealCategory(visibleCategory);
    setLoading(true);
    try {
      let list = [];
      if (USE_BACKEND) {
        list = currentCategory
          ? await fetchFromBackend(currentCategory) // categoría específica
          : await fetchRandomFromBackend();         // TODOS → random
      }
      list = Array.isArray(list) ? list.map(normalizeItem) : [];
      list = filterBySentiment(list);

      noticiasData = list;
      if (noticiasData.length === 0) {
        container.innerHTML = `<div class="loading">No hay noticias para esta selección.</div>`;
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

  // ==== Categorías (usa el PRIMER <ul> del side menu) ====
  const allUls = sideMenu?.querySelectorAll('ul');
  const categoryUl = allUls && allUls.length ? allUls[0] : null;

  categoryUl?.querySelectorAll('li').forEach(li => {
    li.style.cursor = 'pointer';
    li.addEventListener('click', () => {
      categoryUl.querySelectorAll('li').forEach(x => x.classList.remove('active'));
      li.classList.add('active');

      const visible = (li.textContent || '').trim(); // 'Todos' o categoría
      loadAndRender(visible);                         // 'Todos' => random
      sideMenu.classList.remove('open');
    });
  });

  // ==== Sentimientos (id="sentiment-filter") ====
  const sentimentList = document.getElementById('sentiment-filter');
  const SENT_MAP = { '': '', 'positivo': 'positive', 'neutral': 'neutral', 'negativo': 'negative' };

  sentimentList?.querySelectorAll('li').forEach(li => {
    li.style.cursor = 'pointer';
    li.addEventListener('click', () => {
      sentimentList.querySelectorAll('li').forEach(x => x.classList.remove('active'));
      li.classList.add('active');

      const keyEs = (li.dataset.sent ?? '').trim().toLowerCase(); // '', 'positivo', ...
      currentSentiment = SENT_MAP[keyEs] || '';

      // recarga manteniendo la categoría actual
      loadAndRender(currentCategory || 'Todos');
      sideMenu.classList.remove('open');
    });
  });

  // Marcar por defecto “Todos”
  categoryUl?.querySelectorAll('li')?.forEach(li => {
    if ((li.textContent || '').trim().toLowerCase() === 'todos') li.classList.add('active');
  });
  sentimentList?.querySelectorAll('li')?.forEach(li => {
    if ((li.dataset.sent ?? '').trim() === '') li.classList.add('active');
  });

  // Carga inicial: random + sin filtro de sentimiento
  loadAndRender('Todos');
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


// Abrir/cerrar menú lateral
const sideMenu = document.getElementById('side-menu');
document.getElementById('menu-btn')?.addEventListener('click', () => {
  sideMenu.classList.add('is-open');
  document.body.style.overflow = 'hidden';   // evita scroll del body detrás
});
document.getElementById('close-menu')?.addEventListener('click', () => {
  sideMenu.classList.remove('is-open');
  document.body.style.overflow = '';         // restablece check
});
