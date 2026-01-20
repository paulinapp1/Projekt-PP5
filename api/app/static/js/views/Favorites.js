import { Storage } from '../storage.js';

export default class Favorites {
    async render() {
        const favorites = Storage.getFavorites();

        if (favorites.length === 0) {
            return `
                <div class="favorites-page">
                    <h2>Favourites</h2>
                    <p style="text-align:center; color: #666; margin-top: 50px;">Your favorites list is empty.</p>
                </div>`;
        }

        const cards = favorites
            .map(
                (product) => `
            <div class="fav-card" data-id="${product.id}">
                <div class="star-icon active" data-id="${product.id}">★</div>
                <div class="fav-card-image">
                    <img src="${product.image}" alt="${product.name}">
                </div>
                <div class="fav-card-content">
                    <p class="product-id">${product.id}</p>
                    <p class="product-name">${product.name}</p>
                </div>
            </div>
        `,
            )
            .join('');

        return `
            <div class="favorites-page">
                <h2>Favourites</h2>
                <div class="product-grid">
                    ${cards}
                </div>
            </div>
        `;
    }

    async afterRender() {
        const stars = document.querySelectorAll('.star-icon');
        stars.forEach((star) => {
            star.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = e.target.dataset.id;
                const product = Storage.getFavorites().find((p) => p.id === id);
                Storage.toggleFavorite(product);
                window.location.reload();
            });
        });

        const cards = document.querySelectorAll('.fav-card');
        cards.forEach((card) => {
            card.addEventListener('click', () => {
                const id = card.dataset.id;
                window.location.hash = `#/product/${id}`;
            });
        });
    }
}
