import { Api } from '../api.js';

export default class Search {
    async render() {
        return `
            <div class="search-container fade-in">
                <h1>Extract Product Data</h1>
                <div class="search-wrapper">
                    <input type="text" id="product-id" class="search-input" placeholder="Product ID">
                    <button id="extract-btn" class="btn">Search</button>
                    <div id="loader-container"></div>
                </div>
            </div>
        `;
    }

    async afterRender() {
        const btn = document.getElementById('extract-btn');
        const input = document.getElementById('product-id');
        const loaderContainer = document.getElementById('loader-container');

        if (!btn) return;

        btn.addEventListener('click', async () => {
            const productId = input.value.trim();

            if (!productId) {
                alert('Please enter a valid Product ID');
                return;
            }
            btn.disabled = true;
            loaderContainer.innerHTML =
                '<div class="loader"></div><p>Scraping Ceneo... please wait...</p>';

            try {
                const result = await Api.extractProduct(productId);
                window.location.hash = `#/product/${productId}`;
            } catch (err) {
                console.error(err);
                alert('Błąd serwera: ' + err.message);
            } finally {
                btn.disabled = false;
                loaderContainer.innerHTML = '';
            }
        });

        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') btn.click();
        });
    }
}
