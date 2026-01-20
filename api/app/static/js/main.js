import Navbar from './components/Navbar.js';
import Footer from './components/Footer.js';
import { Router } from './router.js';

document.addEventListener('DOMContentLoaded', async () => {
    const header = document.getElementById('header-container');
    if (header) {
        const nav = new Navbar();
        header.innerHTML = nav.render();
    }

    const footer = document.getElementById('footer-container');
    if (footer) {
        const foot = new Footer();
        footer.innerHTML = foot.render();
    }

    Router.init();
});
