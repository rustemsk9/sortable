import AbstractView from "./AbstractView.js";

export default class extends AbstractView {
    constructor() {
        super();
        // this.setTitle("NavBar");
    }

    async getHtml() {
        const response = await fetch('/src/views/paginator.html');
        const html = await response.text();
        return html;
    }

    async init() {
        console.log("Paginator initialized");
    }
}
