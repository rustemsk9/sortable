class DataLoader {
  constructor() {
    this.lastModified = null;
    this.checkInterval = 2000; // Check every 2 seconds
    this.intervalId = null;
    this.dataChangeCallbacks = [];
    this.isRunning = false;
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

  // Check if data.json has been modified
  async checkForUpdates() {
    try {
      const response = await fetch('/src/data/data.json', {
        method: 'HEAD', // Only get headers, not the full content
        cache: 'no-cache' // Ensure we get fresh data
      });
      
      const lastModified = response.headers.get('Last-Modified');
      const etag = response.headers.get('ETag');
      
      // Use ETag or Last-Modified to detect changes
      const currentSignature = etag || lastModified;
      
      if (this.lastModified === null) {
        // First time checking
        this.lastModified = currentSignature;
        return;
      }
      
      if (currentSignature && currentSignature !== this.lastModified) {
        this.lastModified = currentSignature;
        console.log('DataLoader: Data change detected, notifying callbacks');
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

  // Remove callback function
  removeDataChangeCallback(callback) {
    const index = this.dataChangeCallbacks.indexOf(callback);
    if (index > -1) {
      this.dataChangeCallbacks.splice(index, 1);
    }
  }

  // Notify all registered callbacks that data has changed
  notifyDataChange() {
    this.dataChangeCallbacks.forEach(callback => {
      try {
        callback();
      } catch (error) {
        console.error('DataLoader: Error in data change callback:', error);
      }
    });
  }

  // Load fresh data from data.json
  async loadData() {
    try {
      const response = await fetch('/src/data/data.json', {
        cache: 'no-cache' // Ensure we get fresh data
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('DataLoader: Fresh data loaded,', data.length, 'heroes');
      return data;
    } catch (error) {
      console.error('DataLoader: Error loading data:', error);
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