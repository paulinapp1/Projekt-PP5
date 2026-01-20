import { Api } from '../api.js';
import { Storage } from '../storage.js';

export default class Product {
    async render(id) {
        return `<div id="product-content" class="fade-in">
                    <div class="loader"></div>
                    <p style="text-align:center">Loading product data...</p>
                </div>`;
    }

    async afterRender(id) {
        const container = document.getElementById('product-content');
        if (!container) return;

        try {
            const data = await Api.getProduct(id);
            const stats = data.stats || data;

            const starsChartPath = `/static/charts/${id}/stars_chart.html`;
            const recommendationsChartPath = `/static/charts/${id}/recommendations_chart.html`;

            const imageUrl =
                stats.image_url ||
                data.image_url ||
                'https://via.placeholder.com/300x300?text=No+Image+Found';

            const isFav = Storage.isFavorite(id);
            const btnText = isFav
                ? 'Remove from Favourites'
                : 'Add To Favourites';
            const btnColor = isFav ? '#ccc' : '#ff9900';

            container.innerHTML = `
                <div class="product-header">
                    <div class="product-image-container">
                        <img src="${imageUrl}" 
                             class="product-image-large" 
                             alt="${stats.product_name}"
                             onerror="this.src='https://via.placeholder.com/300x300?text=Image+Not+Found'">
                    </div>
                    <div class="product-info">
                        <h2>${stats.product_name || 'Product ' + id}</h2>
                        <h3 style="color:#ff9900">ID: ${id}</h3>
                        <p><strong>Opinions:</strong> ${stats.opinions_count || 0}</p>
                        <p><strong>Average Score:</strong> ${stats.average_stars ? stats.average_stars.toFixed(2) : '0'}/5</p>
                        
                        <button id="fav-btn" class="btn" style="margin-top:20px; background-color: ${btnColor}; color: white; border: none; padding: 10px 20px; cursor: pointer;">
                            ${isFav ? '★' : '☆'} ${btnText}
                        </button>
                    </div>
                </div>

                <div class="stats-section" style="margin-top: 40px;">
                    <h3>Statistics & Charts</h3>
                    <div class="charts-container" style="display: flex; gap: 20px; flex-wrap: wrap;">
                        <div style="flex: 1; min-width: 300px;">
                            <h4>Stars Distribution</h4>
                            <iframe src="${starsChartPath}" style="width:100%; height:400px; border:1px solid #ddd; border-radius: 8px;"></iframe>
                        </div>
                        <div style="flex: 1; min-width: 300px;">
                            <h4>Recommendations</h4>
                            <iframe src="${recommendationsChartPath}" style="width:100%; height:400px; border:1px solid #ddd; border-radius: 8px;"></iframe>
                        </div>
                    </div>
                </div>
            `;

            document
                .getElementById('fav-btn')
                .addEventListener('click', (e) => {
                    Storage.toggleFavorite({
                        id: id,
                        name: stats.product_name,
                        image: imageUrl,
                    });
                    window.location.reload();
                });
        } catch (err) {
            console.error('Product View Error:', err);
            container.innerHTML = `<p style="color:red; text-align:center;">Error: ${err.message}</p>`;
        }
    }
}
