class ElementNode {

    constructor(
        public name: string,
        public attributes: Array<any>,
        private children: ElementNode[]) {
    }

}

class HTMLParser {

    constructor(private htmlSrting: string) {}

    public start() {
        this.buildV2(true, this.htmlSrting)
    }

    build() {

        const htmlString = this.htmlSrting;

        let openTag = false;

        let currentNode!: ElementNode

        for (let index = 0; index < htmlString.length; index++) {

            const char = htmlString[index];

            if(char === "<") {
                openTag = true;

                continue;
            }

            if(openTag) {

                const remaingHTML = htmlString.slice(index)
                let elementName = ""

                // loop to collect the element name
                for (let j = 0; j < remaingHTML.length; j++) {

                    const char = remaingHTML[j];
                    index++;

                    if(char === ">") {

                        const node = new ElementNode(elementName, [], [])
                        currentNode = node;
                        openTag = false;

                        continue
                    }

                    elementName += char;

                }

            }

        }

    }

    buildV2(start: boolean, childHtmlString: string) {

        var htmlString = childHtmlString

        let openTag = false;

        let currentNode!: ElementNode

        for (let index = 0; index < htmlString.length; index++) {

            const char = htmlString[index];

            if(char === "<") {
                openTag = true;

                continue;
            }

            if(openTag) {

                const remaingHTML = htmlString.slice(index)
                let elementName = ""

                // loop to collect the element name
                for (let j = 0; j < remaingHTML.length; j++) {

                    const char = remaingHTML[j];
                    index++;

                    if(char === ">") {

                        const node = new ElementNode(elementName, [], [])
                        currentNode = node;
                        openTag = false;

                        // collect children


                        continue
                    }

                    elementName += char;

                }

            } else {
                if(!openTag) {
                    const closingElementIndex = htmlString.indexOf("</" + currentNode.name + ">")
                    const childHtmlString = htmlString.slice(index).slice(0, closingElementIndex)
                    this.buildV2(false, childHtmlString)
                }
            }

        }


    }

    parseV2() {

    }

}

const _htmlString = `
<html>
  <head>
    <title>Sample HTML</title>
  </head>
  <body>
    <h1>Hello, World!</h1>
    <p>This is a paragraph.</p>
  </body>
</html>
`;

new HTMLParser(_htmlString).start();
//console.log(parsedDocument);
