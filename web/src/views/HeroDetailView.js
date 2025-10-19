import AbstractView from "./AbstractView.js";
import dataLoader from "../data/load.js";

export default class extends AbstractView {
  constructor(params) {
    super();
    this.params = params;
    this.heroId = this.getHeroIdFromUrl();
    this.hero = null;
    this.setTitle("Hero Details");
  }

  getHeroIdFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('id');
  }

  async getHtml() {
    const response = await fetch("/src/views/herodetails.html");
    const htmlString = await response.text();
    return htmlString;
  }

  async init() {
    try {
      await this.loadHeroData();
      
      // Only render if hero was found (loadHeroData handles errors by redirecting)
      if (this.hero) {
        this.renderHeroDetails();
        this.setupEventListeners();
      }
    } catch (error) {
      console.error("Error initializing HeroDetailView:", error);
      // Error handling is done in loadHeroData, but this is a fallback
      this.renderError("Failed to load hero details");
    }
  }

  async loadHeroData() {
    // Use the cached data from DataLoader instead of making a fresh fetch
    // This significantly reduces server requests and improves performance
    try {
      this.hero = await dataLoader.getHeroById(this.heroId);
      
      if (!this.hero) {
        // Hero not found - redirect to 404 error page
        const errorMessage = `Hero with ID "${this.heroId}" not found`;
        const errorDetails = `The hero you're looking for doesn't exist in our database. Please check the ID and try again.`;
        
        console.warn('HeroDetailView: Hero not found for ID:', this.heroId);
        
        // Navigate to error page
        const errorUrl = `/error?code=404&message=${encodeURIComponent(errorMessage)}&details=${encodeURIComponent(errorDetails)}`;
        window.history.replaceState(null, null, errorUrl);
        window.dispatchEvent(new PopStateEvent('popstate'));
        return;
      }
      
      console.log('HeroDetailView: Hero loaded from cache:', this.hero.name);
    } catch (error) {
      console.error('HeroDetailView: Error loading hero data:', error);
      // Handle data loading errors
      const errorMessage = 'Failed to load hero data';
      const errorDetails = `Error: ${error.message}`;
      
      const errorUrl = `/error?code=500&message=${encodeURIComponent(errorMessage)}&details=${encodeURIComponent(errorDetails)}`;
      window.history.replaceState(null, null, errorUrl);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  }

  renderHeroDetails() {
    const heroContent = document.getElementById('hero-content');
    if (!heroContent || !this.hero) return;

    heroContent.innerHTML = `
      <div class="hero-card">
        <div class="hero-header">
          <img src="${this.hero.images?.md || this.hero.images?.sm || this.hero.images?.xs || ''}" 
               alt="${this.hero.name}" 
               class="hero-image" 
               onerror="this.style.display='none'">
          <h1 class="hero-name">${this.hero.name}</h1>
          <p class="hero-full-name">${this.hero.biography?.fullName || 'Unknown'}</p>
        </div>
        
        <div class="hero-content">
          <div class="stats-grid">
            <div class="stat-section">
              <h3>Power Statistics</h3>
              ${this.renderPowerstats()}
            </div>
            
            <div class="stat-section">
              <h3>Appearance</h3>
              <div class="stat-item">
                <span class="stat-label">Gender:</span>
                <span class="stat-value">${this.hero.appearance?.gender || 'Unknown'}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Race:</span>
                <span class="stat-value">${this.hero.appearance?.race || 'Unknown'}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Height:</span>
                <span class="stat-value">${this.formatHeight(this.hero.appearance?.height)}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Weight:</span>
                <span class="stat-value">${this.formatWeight(this.hero.appearance?.weight)}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Eye Color:</span>
                <span class="stat-value">${this.hero.appearance?.eyeColor || 'Unknown'}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Hair Color:</span>
                <span class="stat-value">${this.hero.appearance?.hairColor || 'Unknown'}</span>
              </div>
            </div>
            
            <div class="stat-section">
              <h3>Biography</h3>
              <div class="stat-item">
                <span class="stat-label">Place of Birth:</span>
                <span class="stat-value">${this.hero.biography?.placeOfBirth || 'Unknown'}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Alignment:</span>
                <span class="stat-value">${this.hero.biography?.alignment || 'Unknown'}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Publisher:</span>
                <span class="stat-value">${this.hero.biography?.publisher || 'Unknown'}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">First Appearance:</span>
                <span class="stat-value">${this.hero.biography?.firstAppearance || 'Unknown'}</span>
              </div>
            </div>
            
            <div class="stat-section">
              <h3>Work & Connections</h3>
              <div class="stat-item">
                <span class="stat-label">Occupation:</span>
                <span class="stat-value">${this.hero.work?.occupation || 'Unknown'}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Base:</span>
                <span class="stat-value">${this.hero.work?.base || 'Unknown'}</span>
              </div>
            </div>
          </div>
          
          ${this.renderAliases()}
          ${this.renderConnections()}
        </div>
      </div>
    `;
  }

  renderPowerstats() { // TODO: css need proper stats view
    const stats = this.hero.powerstats || {};
    return Object.entries(stats).map(([stat, value]) => `
      <div class="stat-item">
        <span class="stat-label">${stat.charAt(0).toUpperCase() + stat.slice(1)}:</span>
        <span class="stat-value">${value || 'Unknown'}</span>
        <div class="powerstats-bar"> 
          <div class="powerstats-fill" style="width: ${value || 0}%"></div>
        </div>
      </div>
    `).join('');
  }

  renderAliases() {
    const aliases = this.hero.biography?.aliases;
    if (!aliases || !Array.isArray(aliases) || aliases.length === 0) return '';
    
    return `
      <div class="biography-section">
        <h3>Aliases</h3>
        <p>${aliases.join(', ')}</p>
      </div>
    `;
  }

  renderConnections() {
    const connections = this.hero.connections;
    if (!connections) return '';
    
    return `
      <div class="biography-section">
        <h3>Connections</h3>
        ${connections.groupAffiliation ? `<p><strong>Group Affiliation:</strong> ${connections.groupAffiliation}</p>` : ''}
        ${connections.relatives ? `<p><strong>Relatives:</strong> ${connections.relatives}</p>` : ''}
      </div>
    `;
  }

  formatHeight(height) {
    if (!height || !Array.isArray(height)) return 'Unknown';
    return height.join(' / ');
  }

  formatWeight(weight) {
    if (!weight || !Array.isArray(weight)) return 'Unknown';
    return weight.join(' / ');
  }

  renderError(message) {
    const heroContent = document.getElementById('hero-content');
    if (heroContent) {
      heroContent.innerHTML = `<div class="error-message">OMG${message}</div>`;
    }
  }

  setupEventListeners() {
    const backButton = document.getElementById('back-to-home');
    if (backButton) {
      backButton.addEventListener('click', () => {
        // Track that user is going back to home from hero detail
        this.trackBackNavigation();
        
        // Navigate back to home
        window.history.pushState(null, null, '/');
        window.dispatchEvent(new PopStateEvent('popstate'));
      });
    }
  }

  // Track navigation back to home
  trackBackNavigation() {
    const navigationInfo = {
      source: 'hero-detail-back',
      timestamp: Date.now(),
      heroId: this.heroId,
      heroName: this.hero?.name || 'Unknown',
      referrer: document.referrer,
      url: window.location.href
    };

    try {
      // Add to navigation history
      let navHistory = JSON.parse(localStorage.getItem('navigationHistory') || '[]');
      navHistory.unshift(navigationInfo);
      navHistory = navHistory.slice(0, 10); // Keep only last 10
      
      localStorage.setItem('navigationHistory', JSON.stringify(navHistory));
      console.log('HeroDetailView: Back navigation tracked:', navigationInfo);
    } catch (error) {
      console.error('HeroDetailView: Error tracking back navigation:', error);
    }
  }
}