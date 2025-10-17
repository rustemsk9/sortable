import AbstractView from "./AbstractView.js";

export default class extends AbstractView {
  constructor() {
    super();
    this.setTitle("Superhero Database");
    
    // State management
    this.allHeroes = [];
    this.filteredHeroes = [];
    this.currentPage = 1;
    this.pageSize = 20;
    this.searchTerm = '';
    this.sortColumn = 'name';
    this.sortDirection = 'asc';
    
    // Component references
    this.navBarView = null;
    this.paginatorView = null;
  }

  async getHtml() {
    const response = await fetch("/src/views/home.html");
    const htmlString = await response.text();
    return htmlString;
  }

  async init() {
    try {
      // Load superhero data
      await this.loadHeroData();
      
      // Initialize filtered data
      this.filteredHeroes = [...this.allHeroes];
      
      // Set up callbacks for navbar and paginator
      this.setupComponentCallbacks();
      
      // Set up event listeners for table sorting
      this.setupTableEventListeners();
      
      // Initial sort by name
      this.sortData();
      
      // Render initial view
      this.renderTable();
      this.updatePaginatorState();
      
      console.log("HomeView initialized with", this.allHeroes.length, "superheroes");
    } catch (error) {
      console.error("Error initializing HomeView:", error);
    }
  }

  async loadHeroData() {
    const response = await fetch("/src/data/data.json");
    this.allHeroes = await response.json();
  }

  setupComponentCallbacks() {
    // Set up callbacks for navbar (search and page size)
    const navBarElement = document.querySelector('#navbar');
    if (navBarElement && window.currentNavBarView) {
      window.currentNavBarView.setSearchCallback((searchTerm) => {
        this.handleSearch(searchTerm);
      });
      
      window.currentNavBarView.setPageSizeCallback((pageSize) => {
        this.handlePageSizeChange(pageSize);
      });
    }

    // Set up callback for paginator
    const paginatorElement = document.querySelector('#paginator');
    if (paginatorElement && window.currentPaginatorView) {
      window.currentPaginatorView.setPageChangeCallback((page) => {
        this.handlePageChange(page);
      });
    }
  }

  setupTableEventListeners() {
    // Column sorting
    const sortableHeaders = document.querySelectorAll('.sortable');
    sortableHeaders.forEach(header => {
      header.addEventListener('click', () => {
        const column = header.getAttribute('data-column');
        this.handleSort(column);
      });
    });

    // Add click handlers for hero names to navigate to detail view
    document.addEventListener('click', (e) => {
      if (e.target.closest('.hero-name-link')) {
        e.preventDefault();
        const heroId = e.target.closest('.hero-name-link').dataset.heroId;
        this.navigateToHeroDetail(heroId);
      }
    });
  }

  handleSearch(searchTerm) {
    this.searchTerm = searchTerm.toLowerCase();
    this.filterData();
    this.currentPage = 1;
    this.renderTable();
    this.updatePaginatorState();
  }

  handlePageSizeChange(pageSize) {
    this.pageSize = pageSize === 'all' ? this.filteredHeroes.length : pageSize;
    this.currentPage = 1;
    this.renderTable();
    this.updatePaginatorState();
  }

  handlePageChange(page) {
    this.currentPage = page;
    this.renderTable();
    this.updatePaginatorState();
  }

  filterData() {
    if (!this.searchTerm) {
      this.filteredHeroes = [...this.allHeroes];
    } else {
      this.filteredHeroes = this.allHeroes.filter(hero => 
        hero.name.toLowerCase().includes(this.searchTerm)
      );
    }
    this.sortData();
  }

  handleSort(column) {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    
    this.updateSortHeaders();
    this.sortData();
    this.renderTable();
  }

  updateSortHeaders() {
    // Remove all sort classes
    document.querySelectorAll('.sortable').forEach(header => {
      header.classList.remove('sort-asc', 'sort-desc');
    });
    
    // Add appropriate class to current sort column
    const currentHeader = document.querySelector(`[data-column="${this.sortColumn}"]`);
    if (currentHeader) {
      currentHeader.classList.add(this.sortDirection === 'asc' ? 'sort-asc' : 'sort-desc');
    }
  }

  sortData() {
    this.filteredHeroes.sort((a, b) => {
      let aValue = this.getColumnValue(a, this.sortColumn);
      let bValue = this.getColumnValue(b, this.sortColumn);
      
      // Handle missing values - always sort last
      if (aValue === null || aValue === undefined || aValue === '' || aValue === 'null' || aValue === '-') {
        return 1;
      }
      if (bValue === null || bValue === undefined || bValue === '' || bValue === 'null' || bValue === '-') {
        return -1;
      }
      
      // Handle numerical columns (weight, height, powerstats)
      if (['weight', 'height'].includes(this.sortColumn)) {
        aValue = this.extractNumber(aValue);
        bValue = this.extractNumber(bValue);
      } else if (['intelligence', 'strength', 'speed', 'durability', 'power', 'combat'].includes(this.sortColumn)) {
        aValue = parseInt(aValue) || 0;
        bValue = parseInt(bValue) || 0;
      }
      
      // Sort comparison
      let comparison = 0;
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        comparison = aValue.localeCompare(bValue);
      } else {
        comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      }
      
      return this.sortDirection === 'asc' ? comparison : -comparison;
    });
  }

  getColumnValue(hero, column) {
    switch (column) {
      case 'name':
        return hero.name || '';
      case 'fullName':
        return hero.biography?.fullName || '';
      case 'intelligence':
        return hero.powerstats?.intelligence;
      case 'strength':
        return hero.powerstats?.strength;
      case 'speed':
        return hero.powerstats?.speed;
      case 'durability':
        return hero.powerstats?.durability;
      case 'power':
        return hero.powerstats?.power;
      case 'combat':
        return hero.powerstats?.combat;
      case 'race':
        return hero.appearance?.race || '';
      case 'gender':
        return hero.appearance?.gender || '';
      case 'height':
        return hero.appearance?.height?.[1] || hero.appearance?.height?.[0] || '';
      case 'weight':
        return hero.appearance?.weight?.[1] || hero.appearance?.weight?.[0] || '';
      case 'placeOfBirth':
        return hero.biography?.placeOfBirth || '';
      case 'alignment':
        return hero.biography?.alignment || '';
      default:
        return '';
    }
  }

  extractNumber(value) {
    if (!value) return 0;
    const match = value.toString().match(/[\d.]+/);
    return match ? parseFloat(match[0]) : 0;
  }

  renderTable() {
    const tableBody = document.getElementById('table-body');
    if (!tableBody) return;

    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = Math.min(startIndex + this.pageSize, this.filteredHeroes.length);
    const pageHeroes = this.filteredHeroes.slice(startIndex, endIndex);

    tableBody.innerHTML = '';

    pageHeroes.forEach(hero => {
      const row = document.createElement('tr');
      
      row.innerHTML = `
        <td><img src="${hero.images?.xs || ''}" alt="${hero.name}" class="hero-image" onerror="this.style.display='none'"></td>
        <td><a href="#" class="hero-name-link" data-hero-id="${hero.id}">${hero.name || '-'}</a></td>
        <td>${hero.biography?.fullName || '-'}</td>
        <td>${hero.powerstats?.intelligence || '-'}</td>
        <td>${hero.powerstats?.strength || '-'}</td>
        <td>${hero.powerstats?.speed || '-'}</td>
        <td>${hero.powerstats?.durability || '-'}</td>
        <td>${hero.powerstats?.power || '-'}</td>
        <td>${hero.powerstats?.combat || '-'}</td>
        <td>${hero.appearance?.race || '-'}</td>
        <td>${hero.appearance?.gender || '-'}</td>
        <td>${this.formatHeight(hero.appearance?.height)}</td>
        <td>${this.formatWeight(hero.appearance?.weight)}</td>
        <td>${hero.biography?.placeOfBirth || '-'}</td>
        <td>${hero.biography?.alignment || '-'}</td>
      `;
      
      tableBody.appendChild(row);
    });
  }

  formatHeight(height) {
    if (!height || !Array.isArray(height)) return '-';
    return height.join(' / ');
  }

  formatWeight(weight) {
    if (!weight || !Array.isArray(weight)) return '-';
    return weight.join(' / ');
  }

  updatePaginatorState() {
    if (window.currentPaginatorView) {
      window.currentPaginatorView.updatePagination(
        this.currentPage,
        this.filteredHeroes.length,
        this.pageSize
      );
    }
  }

  navigateToHeroDetail(heroId) {
    window.history.pushState(null, null, `/info/hero?id=${heroId}`);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }

  // Method to refresh data (will be called by load.js when data updates)
  async refreshData() {
    await this.loadHeroData();
    this.filterData();
    this.renderTable();
    this.updatePaginatorState();
    console.log("Data refreshed");
  }
}
