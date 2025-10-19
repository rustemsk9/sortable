export default class AbstractView {
    constructor() {
        this.title = "";
    }

    setTitle(title) {
        this.title = title;
        document.title = title;
    }

    async getHtml() {
        return "";
    }

    async init() {
        console.log("AbstractView initialized");
        // return;
    }
}