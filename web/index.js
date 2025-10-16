import NavBarView from "./src/views/NavBarView.js";
import Home from "./src/views/HomeView.js";
import Paginator from "./src/views/Paginator.js";
// import AbstractView from "./src/views/AbstractView.js";
import FooterView from "./src/views/FooterView.js";

const router = async() => {
    const routes = [
        { path: "/", view: Home },
    ]

    const potentialMatches = routes.map(route => {
        return {
            route: route,
            result: location.pathname === route.path ? [location.pathname] : null
        };
    });

    let match = potentialMatches.find(potentialMatch => potentialMatch.result !== null);
    if (!match) {
        console.log("No match found, defaulting to /");
        match = {
            route: routes[0],
            result: [location.pathname]
        };
    }


    // const pageView = new match.route.view(getParams(match.result));
    
    const navBarView = new NavBarView()
    document.querySelector("#navbar").innerHTML = await navBarView.getHtml();
    await navBarView.init();
    
    const pageView = new match.route.view(match.result);
    // Ensure getHtml() in your view classes does not use 'createElement' directly.
    // If you need to create elements, use 'document.createElement' inside getHtml().
    document.querySelector("#app").innerHTML = await pageView.getHtml();
    // document.querySelector("#app").innerHTML = await pageView.getHtml();
    await pageView.init(document.querySelector("#app"));
    
    const paginator = new Paginator();
    document.querySelector("#paginator").innerHTML = await paginator.getHtml();
    await paginator.init();

    const footerView = new FooterView()
    document.querySelector("#footer").innerHTML = await footerView.getHtml();
    await footerView.init();
};

document.addEventListener("DOMContentLoaded", () => {
    router();
});



