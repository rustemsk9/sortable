import AbstractView from "./AbstractView.js";

export default class extends AbstractView {
    constructor() {
        super();
        this.searchCallback = null;
        // this.pageSizeCallback = null;
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
                    <div class="notification-container">
                        <button id="navbar-refresh-notification" class="refresh-notification-btn" style="display: none;" title="New data available - click to refresh">
                            <span class="exclamation">!</span>
                            <span class="refresh-text">Refresh Data</span>
                        </button>
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
                
                .refresh-notification-btn {
                    background: #ffc107;
                    color: #212529;
                    border: none;
                    padding: 8px 12px;
                    border-radius: 20px;
                    font-size: 14px;
                    font-weight: bold;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    transition: all 0.3s ease;
                    animation: pulse 2s infinite;
                }
                
                .refresh-notification-btn:hover {
                    background: #ffb300;
                    transform: scale(1.05);
                }
                
                .refresh-notification-btn .exclamation {
                    background: #dc3545;
                    color: white;
                    border-radius: 50%;
                    width: 18px;
                    height: 18px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 12px;
                    font-weight: bold;
                }
                
                @keyframes pulse {
                    0% { box-shadow: 0 0 0 0 rgba(255, 193, 7, 0.7); }
                    70% { box-shadow: 0 0 0 10px rgba(255, 193, 7, 0); }
                    100% { box-shadow: 0 0 0 0 rgba(255, 193, 7, 0); }
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
                    
                    .refresh-notification-btn .refresh-text {
                        display: none;
                    }
                    
                    .refresh-notification-btn {
                        padding: 8px;
                        border-radius: 50%;
                        width: 36px;
                        height: 36px;
                        justify-content: center;
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
        const refreshButton = document.getElementById('navbar-refresh-notification');

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

        if (refreshButton) {
            refreshButton.addEventListener('click', () => {
                this.handleRefreshClick();
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

    showRefreshNotification() {
        const refreshButton = document.getElementById('navbar-refresh-notification');
        if (refreshButton) {
            refreshButton.style.display = 'flex';
        }
    }

    hideRefreshNotification() {
        const refreshButton = document.getElementById('navbar-refresh-notification');
        if (refreshButton) {
            refreshButton.style.display = 'none';
        }
    }

    handleRefreshClick() {
        this.hideRefreshNotification();
        // Trigger data refresh through global event or callback
        if (window.currentHomeView && typeof window.currentHomeView.refreshData === 'function') {
            window.currentHomeView.refreshData();
        }
    }
}
