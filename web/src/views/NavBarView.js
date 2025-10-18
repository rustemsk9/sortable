import AbstractView from "./AbstractView.js";

export default class extends AbstractView {
    constructor() {
        super();
        this.searchCallback = null;
        // this.pageSizeCallback = null;
    }

    async getHtml() {
        const response = await fetch("/src/views/navbar.html");
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return await response.text();
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
