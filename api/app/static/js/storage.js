export const Storage = {
    getFavorites() {
        const favs = localStorage.getItem('ceneo_favs');
        return favs ? JSON.parse(favs) : [];
    },

    isFavorite(productId) {
        const favs = this.getFavorites();
        return favs.some((p) => p.id === productId);
    },

    toggleFavorite(product) {
        let favs = this.getFavorites();
        const exists = favs.find((p) => p.id === product.id);

        if (exists) {
            favs = favs.filter((p) => p.id !== product.id);
        } else {
            favs.push({
                id: product.id,
                name: product.name,
                image: product.image,
            });
        }
        localStorage.setItem('ceneo_favs', JSON.stringify(favs));
        return !exists;
    },

    addToHistory(productId) {
        let history = localStorage.getItem('ceneo_history');
        history = history ? JSON.parse(history) : [];

        history = history.filter((id) => id !== productId);
        history.unshift(productId);

        localStorage.setItem('ceneo_history', JSON.stringify(history));
    },

    getHistory() {
        return JSON.parse(localStorage.getItem('ceneo_history') || '[]');
    },
};
