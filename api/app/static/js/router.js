import Home from './views/Home.js';
import Search from './views/Search.js';
import Product from './views/Product.js';
import Favorites from './views/Favorites.js';
import History from './views/History.js';

const routes = {
    '/': Home,
    '/search': Search,
    '/product/:id': Product,
    '/favorites': Favorites,
    '/history': History,
};

export const Router = {
    init() {
        window.addEventListener('hashchange', () => this.loadRoute());
        this.loadRoute();
    },

    parseRequestURL() {
        const url = location.hash.slice(1).toLowerCase() || '/';
        const r = url.split('/');

        return {
            resource: r[1] || '',
            id: r[2] || '',
            verb: r[3] || '',
        };
    },

    async loadRoute() {
        const request = this.parseRequestURL();

        const parsedUrl =
            (request.resource ? '/' + request.resource : '/') +
            (request.id ? '/:id' : '');
        const ViewClass = routes[parsedUrl] ? routes[parsedUrl] : Home;
        const content = document.getElementById('main-container');

        if (content) {
            content.innerHTML = '';

            try {
                const pageInstance = new ViewClass();
                content.innerHTML = await pageInstance.render(request.id);

                if (pageInstance.afterRender) {
                    await pageInstance.afterRender(request.id);
                }
            } catch (error) {
                console.error('Błąd podczas ładowania widoku:', error);
                content.innerHTML =
                    '<h2>Wystąpił błąd podczas ładowania strony.</h2>';
            }
        }

        this.updateActiveLink(request.resource);
    },

    updateActiveLink(resource) {
        document.querySelectorAll('.nav-link').forEach((link) => {
            link.classList.remove('active');
            const href = link.getAttribute('href');
            if ((href === '#/' && !resource) || href === `#/${resource}`) {
                link.classList.add('active');
            }
        });
    },
};
