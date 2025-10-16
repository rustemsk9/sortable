import AbstractView from "./AbstractView.js";

export default class extends AbstractView {
    constructor() {
        super();
        this.setTitle("Home");
    }

    async getHtml() {
        // Fetch data from a local JSON file 


        const response = await fetch('/src/views/home.html');
        const htmlString = await response.text();
        
        // return container.innerHTML;
        // return doc.documentElement.outerHTML;
        // return doc.documentElement.innerHTML;
    return htmlString;
    }

    async init(doc) {
        const data = await fetch('/src/data/data.json');
        const items = await data.json();
        const parser = new DOMParser();
        const docParse = parser.parseFromString(doc, 'text/html');

        const { images: { xs }, name, powerstats, biography: { fullname, placeOfBirth, alignment }, appearance: { race, gender, height, weight } } = items[0];
        console.log(items[0]);
        const container = document.createElement('div');
        container.append("omg");
        container.append(
            document.createElement('img', { src: xs, alt: name }),
            document.createElement('h2', null, name),
            document.createElement('p', null, `Full Name: ${fullname}`),
            document.createElement('p', null, `Race: ${race}`),
            document.createElement('p', null, `Gender: ${gender}`),
            document.createElement('p', null, `Height: ${height.join(', ')}`),
            document.createElement('p', null, `Weight: ${weight.join(', ')}`),
            document.createElement('p', null, `Place of Birth: ${placeOfBirth}`),
            document.createElement('p', null, `Alignment: ${alignment}`),
            document.createElement('h3', null, 'Powerstats'),
            document.createElement('ul', null,
            ...Object.entries(powerstats).map(([stat, value]) =>
                document.createElement('li', {}, `${stat}: ${value}`)
            )
            )
        );
        const container2 = document.createElement('div');
        container2.innerHTML += "<tag>321</tag>";
        // doc.innerHTML += container.outerHTML;
        // docParse.body.appendChild(container);
        docParse.body.appendChild(container2);


        doc.innerHTML += container.outerHTML;
        doc.innerHTML += container2.innerHTML;

        // doc.appendChild(container);

        // doc.appendChild(container);
        // doc = docParse.documentElement.outerHTML;
        console.log("HomeView initialized");
    }
}