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
        return `
            <div class='paginator-view'>
                <div class="pagination-info">
                    <span id="paginator-info">Loading...</span>
                </div>
                <div class="pagination-controls">
                    <button id="paginator-prev" class="page-btn" disabled>Previous</button>
                    <div id="paginator-numbers" class="page-numbers"></div>
                    <button id="paginator-next" class="page-btn">Next</button>
                </div>
            </div>
            
            <style>
                .paginator-view {
                    background: #f8f9fa;
                    padding: 15px 20px;
                    border-top: 1px solid #dee2e6;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    flex-wrap: wrap;
                    gap: 15px;
                }
                
                .pagination-info {
                    color: #6c757d;
                    font-size: 14px;
                }
                
                .pagination-controls {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }
                
                .page-btn {
                    padding: 8px 16px;
                    border: 1px solid #dee2e6;
                    background: white;
                    color: #495057;
                    cursor: pointer;
                    border-radius: 4px;
                    font-size: 14px;
                    transition: all 0.2s;
                }
                
                .page-btn:hover:not(:disabled) {
                    background-color: #e9ecef;
                    border-color: #adb5bd;
                }
                
                .page-btn:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                    background-color: #f8f9fa;
                }
                
                .page-numbers {
                    display: flex;
                    gap: 5px;
                }
                
                .page-number {
                    padding: 6px 12px;
                    border: 1px solid #dee2e6;
                    background: white;
                    color: #495057;
                    cursor: pointer;
                    border-radius: 4px;
                    text-decoration: none;
                    font-size: 14px;
                    transition: all 0.2s;
                    user-select: none;
                }
                
                .page-number:hover {
                    background-color: #e9ecef;
                    border-color: #adb5bd;
                }
                
                .page-number.active {
                    background-color: #007bff;
                    color: white;
                    border-color: #007bff;
                }
                
                .page-ellipsis {
                    padding: 6px 8px;
                    color: #6c757d;
                    user-select: none;
                }
                
                @media (max-width: 768px) {
                    .paginator-view {
                        flex-direction: column;
                        text-align: center;
                        gap: 10px;
                    }
                    
                    .pagination-controls {
                        flex-wrap: wrap;
                        justify-content: center;
                    }
                }
            </style>
        `;
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
