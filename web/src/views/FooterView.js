import AbstractView from "./AbstractView.js";
export default class extends AbstractView { 
    constructor() { 
        super();
        this.title = ""; 
    }

    // setTitle(title) { 
    //     this.title = title; 
    //     document.title = title; 
    // }
    async getHtml() { 
        // You can return HTML as a string here, or import it from another file.
        // For example:
        return `<footer>My Footer Content</footer>`;
        // return ""; 
    }

    async init() { 
        console.log("AbstractView initialized"); 
        // return; 
    }
}
