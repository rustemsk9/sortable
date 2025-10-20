import NavBarView from "./src/views/NavBarView.js";
import HomeView from "./src/views/HomeView.js";
import HeroDetailView from "./src/views/HeroDetailView.js";
import Paginator from "./src/views/Paginator.js";
import dataLoader from "./src/data/load.js";
import dataUpdater from "./src/data/updater.js";

// Global references to current view instances
window.currentNavBarView = null;
window.currentPaginatorView = null;
window.currentHomeView = null;

const router = async () => {
  const routes = [
    { path: "/", view: HomeView },
    { path: "/info/hero", view: HeroDetailView },
  ];

  // Parse the current URL
  const path = location.pathname;
  const search = location.search;
  
  let match = null;
  
  // Find matching route
  for (const route of routes) {
    if (route.path === path) {
      match = { route, result: [path] };
      break;
    }
  }
  
  // Handle unknown routes with 404 error
  if (!match) {
    console.log("No match found for", path, "defaulting to /");
    match = {
      route: routes[0], // Home route
      result: ["/"]
    };
  }

  try {
    // Initialize NavBar
    const navBarView = new NavBarView();
    window.currentNavBarView = navBarView;
    document.querySelector("#navbar").innerHTML = await navBarView.getHtml();
    await navBarView.init();

    // Initialize main page view
    const pageView = new match.route.view(match.result);
    
    document.querySelector("#app").innerHTML = await pageView.getHtml();
    await pageView.init();

    // Store reference to home view for data updates
    if (pageView instanceof HomeView) {
      window.currentHomeView = pageView;
    }

    // Initialize Paginator (only for home page)
    if (match.route.view === HomeView) {
      const paginator = new Paginator();
      window.currentPaginatorView = paginator;
      document.querySelector("#paginator").innerHTML = await paginator.getHtml();
      await paginator.init();
    } else {
      // Clear paginator for other pages
      document.querySelector("#paginator").innerHTML = '';
      window.currentPaginatorView = null;
    }

    // Initialize Footer (commented out)
    // if (match.route.view === HomeView) {
    //   const footerView = new FooterView();
    //   document.querySelector("#footer").innerHTML = await footerView.getHtml();
    //   await footerView.init();
    // } else {
    //   document.querySelector("#footer").innerHTML = '';
    // }

    console.log("Router: Successfully initialized route", path);
  } catch (error) {
    console.error("Router: Error initializing route", path, error);
    // Show basic error in app div
    document.querySelector("#app").innerHTML = `
      <div style="padding: 50px; text-align: center; color: #dc3545;">
        <h1>Error</h1>
        <p>Failed to load page: ${path}</p>
        <p>Error: ${error.message}</p>
        <button onclick="window.location.href='/'" style="
          padding: 10px 20px; background: #007bff; color: white; 
          border: none; border-radius: 5px; cursor: pointer;
        ">Go Home</button>
      </div>
    `;
  }
};

// Handle popstate events (back/forward navigation)
const handlePopState = () => {
  router();
};



// Global error handler for unhandled exceptions
window.addEventListener('error', (event) => {
  console.error('Unhandled error:', event.error);
});

// Global handler for unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
});

// Handle data updates
const handleDataUpdate = async () => {
  console.log("Data update detected, showing refresh notification");
  // console.log("Data update detected, refreshing home view");
  //   if (window.currentHomeView && typeof window.currentHomeView.refreshData === 'function') {
  //     await window.currentHomeView.refreshData();

  if (window.currentNavBarView && typeof window.currentNavBarView.showRefreshNotification === 'function') {
    window.currentNavBarView.showRefreshNotification();
  }
};

// Initialize the application
const initializeApp = async () => {
  try {
    console.log("Initializing application...");

    // Set up data change monitoring
    dataLoader.onDataChange(handleDataUpdate);
    
    // Set up fake data updates listener
    window.addEventListener('dataUpdated', (event) => {
      console.log('New hero added:', event.detail.newHero?.name);
      handleDataUpdate();
    });

    // Set up navigation listeners
    window.addEventListener('popstate', handlePopState);
    
    // Handle link clicks for SPA navigation
    document.addEventListener('click', (e) => {
      const link = e.target.closest('a[href^="/"]'); // Only intercept internal links
      if (link) {
        e.preventDefault();
        const href = link.getAttribute('href');
        if (href !== location.pathname + location.search) {
          console.log("SPA Navigation to:", href);
          window.history.pushState(null, null, href);
          router();
        }
      }
    });

    // Initial route
    console.log("Running initial router...");
    await router();
    
    console.log("Application initialized successfully");
  } catch (error) {
    console.error("Failed to initialize application:", error);
    // Show basic error message
    document.querySelector("#app").innerHTML = `
      <div style="padding: 50px; text-align: center; color: #dc3545;">
        <h1>Application Error</h1>
        <p>Failed to initialize application</p>
        <p>Error: ${error.message}</p>
        <button onclick="window.location.reload()" style="
          padding: 10px 20px; background: #dc3545; color: white; 
          border: none; border-radius: 5px; cursor: pointer;
        ">Reload Page</button>
      </div>
    `;
  }
};

// Start the application when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}

// Expose router globally for debugging
window.router = router;

// Navigation helper functions
window.navigateTo = (path) => {
  if (path !== location.pathname + location.search) {
    window.history.pushState(null, null, path);
    router();
  }
};

window.navigateToHero = (heroId) => {
  window.navigateTo(`/info/hero?id=${heroId}`);
};

window.navigateHome = () => {
  window.navigateTo('/');
};