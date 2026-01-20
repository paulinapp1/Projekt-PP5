import { Api } from '../api.js';
import { Storage } from '../storage.js';

export default class History {
    constructor() {
        this.products = [];
    }

    async render() {
        try {
            const data = await Api.getProducts();
            this.products = Array.isArray(data) ? data : data.products || [];
        } catch (err) {
            console.error('History Load Error:', err);
            return `<div class="fade-in"><p>Błąd ładowania historii: ${err.message}</p></div>`;
        }

        if (this.products.length === 0) {
            return `
                <div class="fade-in" style="text-align:center; margin-top: 50px;">
                    <h2>History</h2>
                    <p>No products in history yet.</p>
                </div>`;
        }

        return `
            <div class="fade-in">
                <h2>History</h2>
                <div class="table-container">
                    <table class="product-table">
                        <thead>
                            <tr>
                                <th></th>
                                <th>Product ID</th>
                                <th>Product Name</th>
                                <th>No. of reviews</th>
                                <th>Avg Stars</th>
                                <th>Recommendation</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${this.products
                                .map((p) => {
                                    const recPos =
                                        p.recommendations_distribution?.[
                                            'Polecam'
                                        ] || 0;
                                    const recNeg =
                                        p.recommendations_distribution?.[
                                            'Nie polecam'
                                        ] || 0;
                                    const recTotal = recPos + recNeg;

                                    const recPercent =
                                        recTotal > 0
                                            ? Math.round(
                                                  (recPos / recTotal) * 100,
                                              )
                                            : 0;

                                    const isFav = Storage.isFavorite(
                                        p.product_id,
                                    );

                                    return `
                                <tr class="history-row" data-id="${p.product_id}" style="cursor:pointer">
                                    <td class="fav-cell">
                                        <span class="history-star ${isFav ? 'active' : ''}" 
                                              data-id="${p.product_id}" 
                                              data-name="${p.product_name}"
                                              data-image="${p.image_url || ''}">
                                            ${isFav ? '★' : '☆'}
                                        </span>
                                    </td>
                                    <td>${p.product_id}</td>
                                    <td class="product-name-cell">${p.product_name}</td>
                                    <td>${p.opinions_count}</td>
                                    <td>${p.average_stars ? p.average_stars.toFixed(1) : '0.0'}</td>
                                    <td>${recPercent}%</td>
                                </tr>
                                `;
                                })
                                .join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    async afterRender() {
        const stars = document.querySelectorAll('.history-star');
        stars.forEach((star) => {
            star.addEventListener('click', (e) => {
                e.stopPropagation();

                const productData = {
                    id: e.target.dataset.id,
                    name: e.target.dataset.name,
                    image_url: e.target.dataset.image,
                };

                Storage.toggleFavorite(productData);
                const isNowFav = Storage.isFavorite(productData.id);
                e.target.innerText = isNowFav ? '★' : '☆';
                e.target.classList.toggle('active', isNowFav);
            });
        });
        const rows = document.querySelectorAll('.history-row');
        rows.forEach((row) => {
            row.addEventListener('click', () => {
                const id = row.dataset.id;
                window.location.hash = `#/product/${id}`;
            });
        });
    }
}
