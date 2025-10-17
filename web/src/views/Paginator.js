import AbstractView from "./AbstractView.js";

export default class extends AbstractView {
    constructor() {
        super();
        this.currentPage = 1;
        this.totalPages = 1;
        this.totalItems = 0;
        this.pageSize = 20;
        this.pageChangeCallback = null;

    }

    async getHtml() {
        const response = await fetch("/src/views/paginator.html");
        const htmlString = await response.text();
        return htmlString;
    }

    async init() {
        this.setupEventListeners();
        this.render();
        console.log("Paginator initialized");
    }

    setupEventListeners() {
        const prevButton = document.getElementById('paginator-prev');
        const nextButton = document.getElementById('paginator-next');

        if (prevButton) {
            prevButton.addEventListener('click', () => {
                if (this.currentPage > 1) {
                    this.goToPage(this.currentPage - 1);
                }
            });
        }

        if (nextButton) {
            nextButton.addEventListener('click', () => {
                if (this.currentPage < this.totalPages) {
                    this.goToPage(this.currentPage + 1);
                }
            });
        }
    }

    goToPage(page) {
        this.currentPage = page;
        this.render();
        if (this.pageChangeCallback) {
            this.pageChangeCallback(page);
        }
    }

    updatePagination(currentPage, totalItems, pageSize) {
        this.currentPage = currentPage;
        this.totalItems = totalItems;
        this.pageSize = pageSize;
        this.totalPages = Math.ceil(totalItems / pageSize);
        this.render();
    }

    render() {
        this.renderInfo();
        this.renderControls();
        this.renderPageNumbers();
    }

    renderInfo() {
        const infoElement = document.getElementById('paginator-info');
        if (!infoElement) return;

        const startIndex = (this.currentPage - 1) * this.pageSize + 1;
        const endIndex = Math.min(this.currentPage * this.pageSize, this.totalItems);
        
        if (this.totalItems === 0) {
            infoElement.textContent = 'No results found';
        } else {
            infoElement.textContent = `Showing ${startIndex}-${endIndex} of ${this.totalItems} results`;
        }
    }

    renderControls() {
        const prevButton = document.getElementById('paginator-prev');
        const nextButton = document.getElementById('paginator-next');

        if (prevButton) {
            prevButton.disabled = this.currentPage <= 1;
        }

        if (nextButton) {
            nextButton.disabled = this.currentPage >= this.totalPages;
        }
    }

    renderPageNumbers() {
        const numbersContainer = document.getElementById('paginator-numbers');
        if (!numbersContainer) return;

        numbersContainer.innerHTML = '';

        if (this.totalPages <= 1) return;

        const maxVisiblePages = 5;
        let startPage = Math.max(1, this.currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(this.totalPages, startPage + maxVisiblePages - 1);

        // Adjust if we're near the end
        if (endPage - startPage < maxVisiblePages - 1) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }

        // Add first page and ellipsis if needed
        if (startPage > 1) {
            this.createPageButton(numbersContainer, 1);
            if (startPage > 2) {
                const ellipsis = document.createElement('span');
                ellipsis.className = 'page-ellipsis';
                ellipsis.textContent = '...';
                numbersContainer.appendChild(ellipsis);
            }
        }

        // Add page numbers
        for (let i = startPage; i <= endPage; i++) {
            this.createPageButton(numbersContainer, i);
        }

        // Add ellipsis and last page if needed
        if (endPage < this.totalPages) {
            if (endPage < this.totalPages - 1) {
                const ellipsis = document.createElement('span');
                ellipsis.className = 'page-ellipsis';
                ellipsis.textContent = '...';
                numbersContainer.appendChild(ellipsis);
            }
            this.createPageButton(numbersContainer, this.totalPages);
        }
    }

    createPageButton(container, pageNumber) {
        const pageButton = document.createElement('span');
        pageButton.className = `page-number ${pageNumber === this.currentPage ? 'active' : ''}`;
        pageButton.textContent = pageNumber;
        pageButton.addEventListener('click', () => {
            this.goToPage(pageNumber);
        });
        container.appendChild(pageButton);
    }

    setPageChangeCallback(callback) {
        this.pageChangeCallback = callback;
    }
}
