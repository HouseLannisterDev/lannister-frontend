document.addEventListener('DOMContentLoaded', () => {
    const menuBtn = document.getElementById('menu-btn');
    const sideMenu = document.getElementById('side-menu');
    const closeMenu = document.getElementById('close-menu');

    menuBtn.addEventListener('click', () => {
        sideMenu.classList.add('open');
    });

    closeMenu.addEventListener('click', () => {
        sideMenu.classList.remove('open');
    });
});
