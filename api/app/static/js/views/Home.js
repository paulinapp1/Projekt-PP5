import { Api } from '../api.js';

export default class Home {
    async render() {
        const featuredIds = ['162617628', '163003681', '187908727'];
        const featuredProducts = await Promise.all(
            featuredIds.map(async (id) => {
                try {
                    const data = await Api.getProduct(id);
                    return data.stats || data;
                } catch (e) {
                    return { product_id: id, product_name: 'Product ' + id };
                }
            }),
        );

        const featuredHtml = featuredProducts
            .map((p) => {
                const fallbackImg = `https://image.ceneostatic.pl/data/products/${p.product_id}/i-product.jpg`;
                const imgSrc = p.image_url || fallbackImg;
                return `
                <div class="fav-card" onclick="window.location.hash='#/product/${p.product_id}'">
                    <div class="fav-card-image">
                        <img src="${imgSrc}" alt="${p.product_name}" onerror="this.src='https://via.placeholder.com/200x300?text=No+Image'">
                    </div>
                    <div class="fav-card-content">
                        <p class="product-id">${p.product_id}</p>
                        <p class="product-name">${p.product_name}</p>
                    </div>
                </div>
            `;
            })
            .join('');

        return `
            <div class="home-page fade-in">
                <section class="hero" style="text-align: center; padding: 40px 20px;">
                    <h1>Ceneo Scraper</h1>                    
                    <div class="how-to-use" style="background: #fdfdfd; padding: 30px; border-radius: 15px; border: 1px solid #eee; max-width: 800px; margin: 0 auto; text-align: left; box-shadow: 0 4px 10px rgba(0,0,0,0.02);">
                        <h3 style="margin-top: 0; color: #ff9900;">How to use?</h3>
                        <ul style="list-style: none; padding: 0;">
                            <li style="margin-bottom: 15px;"><strong>1. Find Product ID:</strong> Go to Ceneo.pl, find your product, and copy the ID from the URL (e.g., 136537247).</li>
                            <li style="margin-bottom: 15px;"><strong>2. Extract Data:</strong> Go to the <a href="#/search" style="color: #ff9900; text-decoration: none; font-weight: bold;">Search</a> tab, enter the ID, and click Search.</li>
                            <li style="margin-bottom: 15px;"><strong>3. Analyze Charts:</strong> View detailed star distributions and recommendation ratios in the product view.</li>
                            <li><strong>4. Save Favourites:</strong> Add products to your list to compare them later in the <a href="#/favorites" style="color: #ff9900; text-decoration: none; font-weight: bold;">Favourites</a> tab.</li>
                        </ul>
                    </div>
                </section>

                <section class="featured-section" style="padding: 20px 20px;">
                    <h3 style="text-align: center; margin-bottom: 30px; font-size: 1.8em;">Featured Products</h3>
                    <div class="product-grid" style="display: flex; justify-content: center; gap: 20px; flex-wrap: wrap;">
                        ${featuredHtml}
                    </div>
                </section>
            </div>
        `;
    }

    async afterRender() {
        console.log('Home rendered with instructions');
    }
}
