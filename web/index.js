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
    let pageView;
    
    if (match.isError) {
      // Use error parameters from match or URL
      let errorParams;
      if (match.errorParams) {
        errorParams = match.errorParams;
      } else {
        // Parse error parameters from URL
        const urlParams = new URLSearchParams(search);
        errorParams = {
          code: urlParams.get('code') || 101,
          message: urlParams.get('message') || 'An unexpected error occurred',
          details: urlParams.get('details') || 'Something went wrong in the superhero database'
        };
      }
      pageView = new ErrorView(errorParams);
    } else {
      pageView = new match.route.view(match.result);
    }
    
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

    // Initialize Footer (skip for error page to maintain error styling)
    // if (!(match.isError || match.route.view === ErrorView)) {
    //   const footerView = new FooterView();
    //   document.querySelector("#footer").innerHTML = await footerView.getHtml();
    //   await footerView.init();
    // } else {
    //   document.querySelector("#footer").innerHTML = '';
    // }

    console.log("Router: Successfully initialized route", path);
  } catch (error) {
    console.error("Router: Error initializing route", path, error);
    // Show error page if route initialization fails
    try {
      await showError(ErrorView.fromException(error, `Failed to initialize route: ${path}`));
    } catch (fallbackError) {
      console.error("Router: Failed to show error page:", fallbackError);
      // Ultimate fallback - show basic error in app div
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
  }
};

// Handle popstate events (back/forward navigation)
const handlePopState = () => {
  router();
};

// Show error page
const showError = async (errorView) => {
  try {
    // Clear all content areas
    document.querySelector("#navbar").innerHTML = '';
    document.querySelector("#paginator").innerHTML = '';
    // document.querySelector("#footer").innerHTML = '';
    
    // Show error
    document.querySelector("#app").innerHTML = await errorView.getHtml();
    await errorView.init();
    
    // Clear global references
    window.currentNavBarView = null;
    window.currentPaginatorView = null;
    window.currentHomeView = null;
    
    console.log("Error page displayed");
  } catch (fallbackError) {
    console.error("Failed to display error page:", fallbackError);
    // Ultimate fallback
    document.querySelector("#app").innerHTML = `
      <div style="text-align: center; padding: 50px; color: #dc3545;">
        <h1>Critical Error</h1>
        <p>Unable to display error page. Please refresh the browser.</p>
        <button onclick="window.location.reload()" style="
          background: #dc3545; color: white; border: none; 
          padding: 10px 20px; border-radius: 5px; cursor: pointer;
        ">Reload Page</button>
      </div>
    `;
  }
};

// Navigate to error page
const navigateToError = (errorCode, message, details) => {
  const errorUrl = `/error?code=${encodeURIComponent(errorCode)}&message=${encodeURIComponent(message)}&details=${encodeURIComponent(details)}`;
  window.history.pushState(null, null, errorUrl);
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
    console.log("Current URL:", window.location.href);
    console.log("Current pathname:", window.location.pathname);
    console.log("Current search:", window.location.search);
    
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
    // Show error page as fallback
    await showError(ErrorView.fromException(error, 'Failed to initialize application'));
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
window.showError = showError;
window.navigateToError = navigateToError;

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