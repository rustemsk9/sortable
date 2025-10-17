import NavBarView from "./src/views/NavBarView.js";
import HomeView from "./src/views/HomeView.js";
import HeroDetailView from "./src/views/HeroDetailView.js";
import Paginator from "./src/views/Paginator.js";
import FooterView from "./src/views/FooterView.js";
import dataLoader from "./src/data/load.js";
import dataUpdater from "./src/data/updater.js";

// Global references to current view instances
window.currentNavBarView = null;
window.currentPaginatorView = null;
window.currentHomeView = null;

const router = async () => {
  const routes = [
    { path: "/", view: HomeView },
    { path: "/info/hero", view: HeroDetailView }
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
  
  // Default to home if no match found
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

    // Initialize Footer
    const footerView = new FooterView();
    document.querySelector("#footer").innerHTML = await footerView.getHtml();
    await footerView.init();

    console.log("Router: Initialized route", path);
  } catch (error) {
    console.error("Router: Error initializing route", path, error);
  }
};

// Handle popstate events (back/forward navigation)
const handlePopState = () => {
  router();
};

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
      const link = e.target.closest('a[href^="/"]');
      if (link) {
        e.preventDefault();
        const href = link.getAttribute('href');
        if (href !== location.pathname + location.search) {
          window.history.pushState(null, null, href);
          router();
        }
      }
    });

    // Initial route
    await router();
    
    console.log("Application initialized successfully");
  } catch (error) {
    console.error("Failed to initialize application:", error);
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
