const API_BASE = '/api';

export const Api = {
    async extractProduct(productId) {
        try {
            // Używamy POST, bo routes.py obsługuje obie metody
            const response = await fetch(
                `${API_BASE}/extract?product_id=${productId}&include_opinions=true`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json', // Niezbędne dla request.json
                    },
                    body: JSON.stringify({}), // Przesyłamy pusty JSON, aby uniknąć błędu 400
                },
            );

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
            // Tutaj używamy GET, ale również dodajemy nagłówek JSON
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

    fixChartPath(path) {
        if (!path) return '';
        // Zamień fizyczną ścieżkę serwera na URL dostępny dla przeglądarki
        let cleanPath = path.replace(/^app\/static\//, '/static/');
        if (!cleanPath.startsWith('/')) cleanPath = '/' + cleanPath;
        return cleanPath;
    },
};
