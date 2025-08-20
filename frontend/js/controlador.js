document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('news-container');
    const pagination = document.getElementById('pagination');
    const pageSize = 10;
    let noticiasData = [];
    let currentPage = 1;

    function renderPage(page) {
        container.innerHTML = "";
        const start = (page - 1) * pageSize;
        const end = start + pageSize;
        const pageItems = noticiasData.slice(start, end);

        pageItems.forEach(noticia => {
            const card = document.createElement('div');
            card.classList.add('news-card', 'entering');
            card.innerHTML = `
                <img src="${noticia.imagen}" alt="Imagen noticia">
                <h2>${noticia.titulo}</h2>
                <p>${noticia.descripcion}</p>
            `;
            container.appendChild(card);

            // animación tipo slider
            setTimeout(() => {
                card.classList.add('show');
            }, 50);
        });
    }

    function renderPagination(totalPages) {
        pagination.innerHTML = "";
        for (let i = 1; i <= totalPages; i++) {
            const btn = document.createElement('button');
            btn.textContent = i;
            btn.classList.toggle('active', i === currentPage);
            btn.addEventListener('click', () => {
                currentPage = i;
                renderPage(currentPage);
                renderPagination(totalPages);
            });
            pagination.appendChild(btn);
        }
    }

    fetch('data/noticias.json')
        .then(res => res.json())
        .then(noticias => {
            noticiasData = noticias;
            const totalPages = Math.ceil(noticias.length / pageSize);
            renderPage(currentPage);
            renderPagination(totalPages);
        })
        .catch(error => console.error('Error cargando noticias:', error));
});
