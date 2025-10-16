import AbstractView from "./AbstractView.js";

export default class extends AbstractView {
    constructor() {
        super();
        // this.setTitle("NavBar");
    }

    async getHtml() {
        return '<a>[navbar] Sortable</a>';
    }

    async init() {
        console.log("NavBar initialized");
    }
}
