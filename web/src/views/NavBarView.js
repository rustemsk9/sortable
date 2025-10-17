import AbstractView from "./AbstractView.js";

export default class extends AbstractView {
    constructor() {
        super();
        this.searchCallback = null;
        this.pageSizeCallback = null;
    }

    async getHtml() {
        return `
            <nav class="navbar">
                <div class="navbar-brand">
                    <a href="/" class="brand-link">🦸 Superhero Database</a>
                </div>
                <div class="navbar-controls">
                    <div class="search-container">
                        <input type="text" id="navbar-search" placeholder="Search superheroes..." />
                    </div>
                    <div class="page-size-container">
                        <label for="navbar-page-size">Show:</label>
                        <select id="navbar-page-size">
                            <option value="10">10</option>
                            <option value="20" selected>20</option>
                            <option value="50">50</option>
                            <option value="100">100</option>
                            <option value="all">All</option>
                        </select>
                    </div>
                </div>
            </nav>
            
            <style>
                .navbar {
                    background: #343a40;
                    color: white;
                    padding: 15px 20px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    flex-wrap: wrap;
                    gap: 15px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }
                
                .navbar-brand .brand-link {
                    color: white;
                    text-decoration: none;
                    font-size: 1.5em;
                    font-weight: bold;
                }
                
                .navbar-brand .brand-link:hover {
                    color: #ffc107;
                }
                
                .navbar-controls {
                    display: flex;
                    align-items: center;
                    gap: 20px;
                    flex-wrap: wrap;
                }
                
                .search-container input {
                    padding: 8px 12px;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                    font-size: 14px;
                    width: 250px;
                }
                
                .page-size-container {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    color: white;
                }
                
                .page-size-container select {
                    padding: 6px 10px;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                    font-size: 14px;
                }
                
                @media (max-width: 768px) {
                    .navbar {
                        flex-direction: column;
                        text-align: center;
                    }
                    
                    .navbar-controls {
                        flex-direction: column;
                        gap: 10px;
                    }
                    
                    .search-container input {
                        width: 200px;
                    }
                }
            </style>
        `;
    }

    async init() {
        this.setupEventListeners();
        console.log("NavBar initialized");
    }

    setupEventListeners() {
        const searchInput = document.getElementById('navbar-search');
        const pageSizeSelect = document.getElementById('navbar-page-size');

        if (searchInput && this.searchCallback) {
            searchInput.addEventListener('input', (e) => {
                this.searchCallback(e.target.value);
            });
        }

        if (pageSizeSelect && this.pageSizeCallback) {
            pageSizeSelect.addEventListener('change', (e) => {
                const value = e.target.value === 'all' ? 'all' : parseInt(e.target.value);
                this.pageSizeCallback(value);
            });
        }
    }

    setSearchCallback(callback) {
        this.searchCallback = callback;
        // Re-setup listeners if the navbar is already initialized
        if (document.getElementById('navbar-search')) {
            this.setupEventListeners();
        }
    }

    setPageSizeCallback(callback) {
        this.pageSizeCallback = callback;
        // Re-setup listeners if the navbar is already initialized
        if (document.getElementById('navbar-page-size')) {
            this.setupEventListeners();
        }
    }

    updateSearchValue(value) {
        const searchInput = document.getElementById('navbar-search');
        if (searchInput) {
            searchInput.value = value;
        }
    }

    updatePageSize(size) {
        const pageSizeSelect = document.getElementById('navbar-page-size');
        if (pageSizeSelect) {
            pageSizeSelect.value = size;
        }
    }
}
