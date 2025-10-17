import { getRandomAdditionalHero, createRandomHeroVariation } from './updater.data.js';

class DataUpdater {
  constructor() {
    this.updateInterval = 10000; // 10 seconds
    this.intervalId = null;
    this.isRunning = false;
    this.originalData = null;
    this.currentData = null;
    this.addedHeroes = [];
    this.updateCount = 0;
  }

  // Start the fake data updater
  async start() {
    if (this.isRunning) {
      console.log('DataUpdater: Already running');
      return;
    }

    try {
      // Load initial data
      await this.loadOriginalData();
      this.isRunning = true;

      // Start the update cycle
      this.intervalId = setInterval(() => {
        this.performFakeUpdate();
      }, this.updateInterval);

      console.log('DataUpdater: Started fake data updates every', this.updateInterval / 1000, 'seconds');
    } catch (error) {
      console.error('DataUpdater: Failed to start:', error);
    }
  }

  // Stop the fake data updater
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log('DataUpdater: Stopped fake data updates');
  }

  // Load the original data from the server
  async loadOriginalData() {
    try {
      const response = await fetch('/src/data/data.json', { cache: 'no-cache' });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      this.originalData = await response.json();
      this.currentData = JSON.parse(JSON.stringify(this.originalData)); // Deep clone
      
      // Load previously added heroes from localStorage
      this.loadAddedHeroes();
      
      console.log('DataUpdater: Loaded original data with', this.originalData.length, 'heroes');
      if (this.addedHeroes.length > 0) {
        console.log('DataUpdater: Restored', this.addedHeroes.length, 'previously added heroes');
      }
    } catch (error) {
      console.error('DataUpdater: Error loading original data:', error);
      throw error;
    }
  }

  // Load added heroes from localStorage
  loadAddedHeroes() {
    try {
      const savedHeroes = localStorage.getItem('updatedHeroesData');
      if (savedHeroes) {
        this.addedHeroes = JSON.parse(savedHeroes);
        // Add them to current data
        this.currentData = [...this.originalData, ...this.addedHeroes];
        console.log('DataUpdater: Loaded', this.addedHeroes.length, 'added heroes from localStorage');
      }
    } catch (error) {
      console.error('DataUpdater: Error loading added heroes from localStorage:', error);
      this.addedHeroes = [];
    }
  }

  // Perform a fake update to the data
  async performFakeUpdate() {
    if (!this.currentData || !this.originalData) {
      console.error('DataUpdater: No data loaded');
      return;
    }

    this.updateCount++;
    console.log(`DataUpdater: Performing fake update #${this.updateCount}`);

    try {
      let newHero;
      
      // Decide what type of update to perform
      const updateType = Math.random();
      
      if (updateType < 0.6) {
        // 60% chance: Add a completely new hero from our predefined list
        newHero = getRandomAdditionalHero();
        newHero.id = Date.now() + Math.floor(Math.random() * 1000);
        console.log('DataUpdater: Adding new predefined hero:', newHero.name);
      } else {
        // 40% chance: Create a variation of an existing hero
        const randomIndex = Math.floor(Math.random() * this.originalData.length);
        const baseHero = this.originalData[randomIndex];
        newHero = createRandomHeroVariation(baseHero);
        console.log('DataUpdater: Adding variation of', baseHero.name, ':', newHero.name);
      }

      // Add the new hero to current data
      this.currentData.push(newHero);
      this.addedHeroes.push(newHero);

      // Simulate writing to the server by making a fake POST request
      await this.simulateDataWrite();

      console.log('DataUpdater: Successfully added hero. Total heroes:', this.currentData.length);
    } catch (error) {
      console.error('DataUpdater: Error during fake update:', error);
    }
  }

  // Simulate writing data to the server and save to updated.data.json
  async simulateDataWrite() {
    // In a real scenario, this would make a POST/PUT request to update the server data
    // For our fake updater, we'll save added heroes to localStorage to simulate persistence
    
    return new Promise((resolve) => {
      setTimeout(() => {
        // Save added heroes to localStorage (simulating updated.data.json)
        localStorage.setItem('updatedHeroesData', JSON.stringify(this.addedHeroes));
        
        // Trigger the data change detection by updating localStorage
        const fakeUpdate = {
          timestamp: Date.now(),
          dataLength: this.currentData.length,
          lastHero: this.addedHeroes[this.addedHeroes.length - 1]?.name,
          addedHeroesCount: this.addedHeroes.length
        };
        
        localStorage.setItem('fakeDataUpdate', JSON.stringify(fakeUpdate));
        
        console.log('DataUpdater: Saved', this.addedHeroes.length, 'added heroes to localStorage');
        
        // Dispatch a custom event to notify components
        window.dispatchEvent(new CustomEvent('dataUpdated', {
          detail: {
            newHero: this.addedHeroes[this.addedHeroes.length - 1],
            totalHeroes: this.currentData.length,
            addedHeroes: this.addedHeroes
          }
        }));
        
        resolve();
      }, 100); // Simulate network delay
    });
  }

  // Get current data (for testing purposes)
  getCurrentData() {
    return this.currentData;
  }

  // Get added heroes (for testing purposes)
  getAddedHeroes() {
    return this.addedHeroes;
  }

  // Get combined data (original + added heroes) - static method for external use
  static async getCombinedData() {
    try {
      // Load original data
      const response = await fetch('/src/data/data.json', { cache: 'no-cache' });
      const originalData = await response.json();
      
      // Load added heroes from localStorage
      const savedHeroes = localStorage.getItem('updatedHeroesData');
      const addedHeroes = savedHeroes ? JSON.parse(savedHeroes) : [];
      
      // Combine and return
      const combinedData = [...originalData, ...addedHeroes];
      console.log('DataUpdater: Combined data - Original:', originalData.length, 'Added:', addedHeroes.length, 'Total:', combinedData.length);
      
      return combinedData;
    } catch (error) {
      console.error('DataUpdater: Error getting combined data:', error);
      // Fallback to just original data
      const response = await fetch('/src/data/data.json', { cache: 'no-cache' });
      return await response.json();
    }
  }

  // Reset to original data
  reset() {
    if (this.originalData) {
      this.currentData = JSON.parse(JSON.stringify(this.originalData));
      this.addedHeroes = [];
      this.updateCount = 0;
      // Clear localStorage
      localStorage.removeItem('updatedHeroesData');
      localStorage.removeItem('fakeDataUpdate');
      console.log('DataUpdater: Reset to original data and cleared localStorage');
    }
  }

  // Clear all added heroes (static method for external use)
  static clearAddedHeroes() {
    localStorage.removeItem('updatedHeroesData');
    localStorage.removeItem('fakeDataUpdate');
    console.log('DataUpdater: Cleared all added heroes from localStorage');
  }

  // Get statistics about updates
  getStats() {
    return {
      isRunning: this.isRunning,
      updateCount: this.updateCount,
      totalHeroes: this.currentData?.length || 0,
      addedHeroes: this.addedHeroes.length,
      originalHeroes: this.originalData?.length || 0
    };
  }

  // Force an immediate update (for testing)
  async forceUpdate() {
    if (this.isRunning) {
      await this.performFakeUpdate();
    } else {
      console.log('DataUpdater: Not running, cannot force update');
    }
  }
}

// Create singleton instance
const dataUpdater = new DataUpdater();

// Auto-start in browser environment
if (typeof window !== 'undefined') {
  // Start the updater when the page loads
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(() => {
        dataUpdater.start();
      }, 2000); // Wait 2 seconds after page load
    });
  } else {
    setTimeout(() => {
      dataUpdater.start();
    }, 2000);
  }

  // Stop updater when page unloads
  window.addEventListener('beforeunload', () => {
    dataUpdater.stop();
  });

  // Expose to global scope for debugging
  window.dataUpdater = dataUpdater;
  
  // Add debugging helpers
  window.clearFakeHeroes = () => DataUpdater.clearAddedHeroes();
  window.getCombinedData = () => DataUpdater.getCombinedData();
  window.getAddedHeroesCount = () => {
    const saved = localStorage.getItem('updatedHeroesData');
    return saved ? JSON.parse(saved).length : 0;
  };
}

export default dataUpdater;