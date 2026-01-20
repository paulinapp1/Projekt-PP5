const API_BASE = '/api';

export const Api = {
    async extractProduct(productId) {
        try {
            const response = await fetch(`${API_BASE}/extract`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    product_id: productId,
                    include_opinions: true,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Extraction failed');
            }
            return await response.json();
        } catch (error) {
            console.error('Extraction error:', error);
            throw error;
        }
    },

    async getProduct(productId) {
        try {
            const response = await fetch(
                `${API_BASE}/product/${productId}?include_opinions=true`,
                {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                },
            );
            if (!response.ok) throw new Error('Product local data not found');
            return await response.json();
        } catch (error) {
            console.error('Fetch error:', error);
            throw error;
        }
    },

    async getProducts() {
        try {
            const response = await fetch('/api/products', {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
            });

            if (!response.ok) {
                throw new Error('Nie udało się pobrać listy produktów');
            }

            return await response.json();
        } catch (error) {
            console.error('API Error (getProducts):', error);
            throw error;
        }
    },
};
