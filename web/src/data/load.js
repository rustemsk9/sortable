class DataLoader {
  constructor() {
    this.lastModified = null;
    this.checkInterval = 10000; // Check every 30 seconds (reduced from 10s to prevent throttling)
    this.intervalId = null;
    this.dataChangeCallbacks = [];
    this.isRunning = false;
    this.cachedData = null;
    this.cacheTimestamp = null;
    this.cacheMaxAge = 60000; // Cache valid for 1 minute
    this.configChangeCallbacks = [];
  }

  // Start monitoring data.json for changes
  startMonitoring() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.checkForUpdates(); // Initial check
    
    this.intervalId = setInterval(() => {
      this.checkForUpdates();
    }, this.checkInterval);
    
    console.log('DataLoader: Started monitoring data.json for changes');
  }

  // Stop monitoring
  stopMonitoring() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log('DataLoader: Stopped monitoring data.json');
  }

  removeConfigChangeCallback(callback) {
    const i = this.configChangeCallbacks.indexOf(callback);
    if (i > -1) this.configChangeCallbacks.splice(i, 1);
  }

  // Notify config callbacks
  async notifyConfigChange(newConfig) {
    this.clearCache(); // optional: clear cache if config affects data
    for (const cb of this.configChangeCallbacks) {
      try {
        await cb(newConfig);
      } catch (err) {
        console.error('DataLoader: config callback error', err);
      }
    }
  }

  // Check if data.json has been modified or if fake data has been updated
  async checkForUpdates() {
    try {
      // Check original data.json
      const response = await fetch('/src/data/data.json', {
        method: 'HEAD', // Only get headers, not the full content
        cache: 'no-cache' // Ensure we get fresh data
      });
      
      // Also check server config file for changes
     let configSignature = null;
     try {
       const cfgResp = await fetch('/config.json', { method: 'HEAD', cache: 'no-cache' });
       const cfgETag = cfgResp.headers.get('ETag');

       const cfgLast = cfgResp.headers.get('Last-Modified');
       configSignature = cfgETag || cfgLast || null;
     } catch (cfgErr) {
       // ignore config HEAD failures
       configSignature = null;
      
     }
      
      const lastModified = response.headers.get('Last-Modified');
      const etag = response.headers.get('ETag');
      
      // Use ETag or Last-Modified to detect changes
      const currentSignature = etag || lastModified;
      
      // combine config signature into the current signature
      const currentWithConfig = currentSignature + '|' + (configSignature || '');
      
      // Also check for fake data updates in localStorage
      const fakeUpdate = localStorage.getItem('fakeDataUpdate');
      const fakeUpdateData = fakeUpdate ? JSON.parse(fakeUpdate) : null;
      const fakeSignature = fakeUpdateData ? fakeUpdateData.timestamp : null;
      
      // Combine signatures (data + config + fake updates)
      const combinedSignature = (currentWithConfig || '') + '|' + (fakeSignature || '');
      
      if (this.lastModified === null) {
        // First time checking
        this.lastModified = combinedSignature;
        return;
      }
      
      if (combinedSignature !== this.lastModified) {
        // fetch fresh config when signature changed (best-effort)
        let newConfig = null;
        try {
          const cfgResp = await fetch('/config.json', { cache: 'no-cache' });
          if (cfgResp.ok) newConfig = await cfgResp.json();
        } catch (e) { /* ignore */ }

        // notify config-specific callbacks
        if (newConfig) {
          await this.notifyConfigChange(newConfig);
        }

        // notify general data change callbacks (existing behavior)
        this.lastModified = combinedSignature;
        console.log('DataLoader: Data change detected (config, real or fake), notifying callbacks');
        this.notifyDataChange();
      }
    } catch (error) {
      console.error('DataLoader: Error checking for updates:', error);
    }
  }

  // Add callback function to be called when data changes
  onDataChange(callback) {
    if (typeof callback === 'function') {
      this.dataChangeCallbacks.push(callback);
    }
  }

  // Add callback function to be called when config changes
  onConfigChange(callback) {
    if (typeof callback === 'function') {
      this.configChangeCallbacks.push(callback);
    }
  }

  // Remove callback function
  removeDataChangeCallback(callback) {
    const index = this.dataChangeCallbacks.indexOf(callback);
    if (index > -1) {
      this.dataChangeCallbacks.splice(index, 1);
    }
  }

  // Notify all registered callbacks that data has changed
  notifyDataChange() {
    // Clear cache when data changes
    this.clearCache();
    
    this.dataChangeCallbacks.forEach(callback => {
      try {
        callback();
      } catch (error) {
        console.error('DataLoader: Error in data change callback:', error);
      }
    });
  }

  // Clear the cached data
  clearCache() {
    this.cachedData = null;
    this.cacheTimestamp = null;
    console.log('DataLoader: Cache cleared');
  }

  // Get a hero by ID from cached data (for HeroDetailView)
  async getHeroById(heroId) {
    const data = await this.loadData();
    return data.find(hero => hero.id.toString() === heroId.toString());
  }

  // Load fresh data from data.json and combine with added heroes
  async loadData() {
    // Check if cached data is still fresh
    const now = Date.now();
    if (this.cachedData && this.cacheTimestamp && (now - this.cacheTimestamp < this.cacheMaxAge)) {
      console.log('DataLoader: Using cached data');
      return this.cachedData;
    }

    try {
      // Load original data
      const response = await fetch('/src/data/data.json', {
        cache: 'no-cache' // Ensure we get fresh data
      });
      
      if (!response.ok) {
        // Handle HTTP errors
        if (response.status === 404) {
          throw new Error(`Data file not found (404): /src/data/data.json`);
        } else if (response.status >= 500) {
          throw new Error(`Server error (${response.status}): ${response.statusText}`);
        } else {
          throw new Error(`HTTP error (${response.status}): ${response.statusText}`);
        }
      }
      
      const originalData = await response.json();
      
      if (!Array.isArray(originalData)) {
        throw new Error('Invalid data format: Expected an array of heroes');
      }
      
      // Load added heroes from localStorage
      const savedHeroes = localStorage.getItem('updatedHeroesData');
      let addedHeroes = [];
      
      if (savedHeroes) {
        try {
          addedHeroes = JSON.parse(savedHeroes);
          if (!Array.isArray(addedHeroes)) {
            console.warn('DataLoader: Invalid added heroes data, ignoring');
            addedHeroes = [];
            localStorage.removeItem('updatedHeroesData');
          }
        } catch (parseError) {
          console.warn('DataLoader: Failed to parse added heroes, ignoring:', parseError);
          localStorage.removeItem('updatedHeroesData');
        }
      }
      
      // Combine data
      const combinedData = [...originalData, ...addedHeroes];
      
      // Cache the data
      this.cachedData = combinedData;
      this.cacheTimestamp = now;
      
      console.log('DataLoader: Fresh data loaded and cached - Original:', originalData.length, 'Added:', addedHeroes.length, 'Total:', combinedData.length);
      return combinedData;
    } catch (error) {
      console.error('DataLoader: Error loading data:', error);
      
      // If we have cached data, return it as fallback
      if (this.cachedData) {
        console.warn('DataLoader: Using stale cached data due to error');
        return this.cachedData;
      }
      
      // No cached data available, propagate the error
      throw error;
    }
  }

  // Get current data without checking for changes
  async getCurrentData() {
    return this.loadData();
  }

  // Force check for updates (useful for manual refresh)
  async forceCheck() {
    await this.checkForUpdates();
  }

  // Reset the last modified timestamp (useful for testing)
  reset() {
    this.lastModified = null;
  }

  // Force refresh the data (bypasses cache)
  async forceRefresh() {
    this.clearCache();
    return await this.loadData();
  }
}

// Create a singleton instance
const dataLoader = new DataLoader();

// Auto-start monitoring when the module is loaded
if (typeof window !== 'undefined') {
  // Browser environment
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      dataLoader.startMonitoring();
    });
  } else {
    dataLoader.startMonitoring();
  }

  // Stop monitoring when the page is about to unload
  window.addEventListener('beforeunload', () => {
    dataLoader.stopMonitoring();
  });
}

// Export the singleton instance
export default dataLoader;