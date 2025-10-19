import AbstractView from "./AbstractView.js";

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
    return `
      <div class="hero-detail-view">
        <div class="hero-detail-container">
          <div class="back-button-container">
            <button id="back-to-home" class="back-button">← Back to Heroes</button>
          </div>
          <div id="hero-content">
            <div class="loading">Loading hero details...</div>
          </div>
        </div>
      </div>

      <style>
        .hero-detail-view {
          padding: 20px;
          max-width: 1200px;
          margin: 0 auto;
        }

        .back-button {
          background: #007bff;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 5px;
          cursor: pointer;
          font-size: 14px;
          margin-bottom: 20px;
        }

        .back-button:hover {
          background: #0056b3;
        }

        .hero-card {
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          overflow: hidden;
          margin-bottom: 20px;
        }

        .hero-header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 30px;
          text-align: center;
        }

        .hero-image {
          width: 150px;
          height: 150px;
          border-radius: 50%;
          object-fit: cover;
          border: 5px solid white;
          margin-bottom: 20px;
        }

        .hero-name {
          font-size: 2.5em;
          margin: 10px 0;
          font-weight: bold;
        }

        .hero-full-name {
          font-size: 1.2em;
          opacity: 0.9;
        }

        .hero-content {
          padding: 30px;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
        }

        .stat-section {
          background: #f8f9fa;
          padding: 20px;
          border-radius: 8px;
          border-left: 4px solid #007bff;
        }

        .stat-section h3 {
          margin: 0 0 15px 0;
          color: #333;
          font-size: 1.3em;
        }

        .stat-item {
          display: flex;
          justify-content: space-between;
          margin: 8px 0;
          padding: 5px 0;
          border-bottom: 1px solid #e9ecef;
        }

        .stat-item:last-child {
          border-bottom: none;
        }

        .stat-label {
          font-weight: 600;
          color: #555;
        }

        .stat-value {
          color: #333;
        }

        .powerstats-bar {
          width: 100%;
          background: #e9ecef;
          border-radius: 10px;
          height: 20px;
          margin-top: 5px;
          overflow: hidden;
        }

        .powerstats-fill {
          height: 100%;
          background: linear-gradient(90deg, #ff6b6b, #feca57);
          border-radius: 10px;
          transition: width 0.3s ease;
        }

        .biography-section {
          background: #f8f9fa;
          padding: 20px;
          border-radius: 8px;
          margin-top: 20px;
        }

        .error-message {
          text-align: center;
          color: #dc3545;
          font-size: 1.2em;
          padding: 40px;
        }

        .loading {
          text-align: center;
          color: #666;
          font-size: 1.2em;
          padding: 40px;
        }

        @media (max-width: 768px) {
          .stats-grid {
            grid-template-columns: 1fr;
          }
          
          .hero-header {
            padding: 20px;
          }
          
          .hero-name {
            font-size: 2em;
          }
        }
      </style>
    `;
  }

  async init() {
    try {
      await this.loadHeroData(); // TODO: proper json with proper data handler...
      this.renderHeroDetails();
      this.setupEventListeners();
    } catch (error) {
      console.error("Error initializing HeroDetailView:", error);
      this.renderError("Failed to load hero details");
    }
  }

  async loadHeroData() { // TODO: proper data handler // check data from homeview?
    const response = await fetch("/src/data/data.json");
    const heroes = await response.json();
    
    this.hero = heroes.find(hero => hero.id.toString() === this.heroId);
    
    if (!this.hero) {
        const localData = localStorage.getItem('updatedHeroesData');
        if (localData) {
            const localHeroes = JSON.parse(localData);
            this.hero = localHeroes.find(hero => hero.id.toString() === this.heroId);
        } else {
            throw new Error("Hero not found");
        }
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
      heroContent.innerHTML = `<div class="error-message">${message}</div>`;
    }
  }

  setupEventListeners() {
    const backButton = document.getElementById('back-to-home');
    if (backButton) {
      backButton.addEventListener('click', () => {
        // window.history.back(); // TODO: simple SPA navigation, but need to ensure proper state
        window.history.pushState(null, null, '/');

        window.dispatchEvent(new PopStateEvent('popstate'));
      });
    }
  }
}