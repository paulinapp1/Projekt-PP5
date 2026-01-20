export default class Navbar {
    render() {
        return `
            <nav class="navbar">
                <div class="logo">CENEO <span>Web Scrapper</span></div>
                <div class="nav-links">
                    <a href="#/" class="nav-link" data-link>Home</a>
                    <a href="#/search" class="nav-link" data-link>Search</a>
                    <a href="#/history" class="nav-link" data-link>History</a>
                    <a href="#/favorites" class="nav-link" data-link>Favourites</a>
                </div>
            </nav>
        `;
    }
}
