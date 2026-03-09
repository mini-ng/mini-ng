import {Token} from "../types/types";
import {AttributeParser} from "../attr-parser/attribute-parser";

export class Tokenizer {

    constructor(private html: string) {}

    public static getInstance(html: string): Tokenizer {
        return new Tokenizer(html)
    }

    public start() {

        this.html = this.html.split("").filter(char => {
            if (char === "\n") {
                return false
            }

            return true;
        }).join("")

        let openTag = false;
        let comment = false;
        let DOCTYPE = false;

        let elementName = "";

        const tokens: Array<Token> = [];

        for (let index = 0; index < this.html.length; index++) {

            const char = this.html[index];
            const nextChar = this.html[index + 1];

            if(char === "<" && openTag === false) {

                // check for comment
                if(nextChar === "!") {
                    if(this.html[index + 2] === "-") {

                        comment = true;
                        continue;

                    } else if(this.html[index + 2] === "D") {
                        // we have "DOCTYPE"
                        DOCTYPE = true;
                        continue;
                    }

                }

                openTag = true;
                continue;
            }

            if(comment) {
                if(char === "-" && nextChar === ">") {
                    comment = false;
                    continue;
                }
                continue
            }

            if(DOCTYPE) {
                if(char === ">") {
                    DOCTYPE = false;
                    continue;
                }
                continue
            }

            if(openTag) {

                elementName += char

                // make sure that the ">"
                if(nextChar === ">" && !this.isInsideAttributeValue(elementName)) {

                    if(elementName.startsWith("/")) {

                        tokens.push({
                            name: elementName,
                            endTag: true,
                            type: "node"
                        })
    
                    } else {

                        // gather attributes
                        const elementNameParts = elementName.split(" ")

                        // first is the element name
                        const name = elementNameParts[0];

                        const elementAttributes = this.processAttributes(elementNameParts.slice(1))

                        tokens.push({
                            name,
                            attributes: elementAttributes,
                            startTag: true,
                            type: "node"
                        });
    
                    }

                    elementName = ""

                    openTag = false;
                    continue;

                }

            }
            else if(!comment || !DOCTYPE) {

                if(char === ">") {
                    continue;
                }

                let textName = ""

                for (let j = index; j < this.html.length; j++) {

                    const textChar = this.html[j];
                    textName += textChar;

                    if(this.html[j + 1] === "<") {

                        tokens.push({
                            name: textName,
                            type: "text"
                        })
                        textName = ""

                        index = j;
                        break;

                    }
                    
                }

            }
            
        }

        tokens.push({
            name: "EOF",
            type: "EOF",
        })

        const mappedTokens = tokens.map((token, index) => {
            return {
                index,
                ...token
            }
        });

        // console.log(mappedTokens)

        return mappedTokens

    }

    private isInsideAttributeValue(elementName: string) {
        // check we have " or ' left
        // and we have = after " or '

        let insideAttribute = false;

        const reversedElementName = elementName
            .split("=")
            .map( part => part.trim())
            .join("=")
            .split("").reverse().join("");

        let sawAttributeValueOpen = false

        for(let i = 0; i < reversedElementName.length; i++) {
            const char = reversedElementName[i];
            const nextChar = reversedElementName[i + 1];

            if(char === '"' && nextChar !== "=") {
                sawAttributeValueOpen = true
                continue
            }

            if(!sawAttributeValueOpen && char === '"' && nextChar === "=") {
                insideAttribute = true;
                break;
            }
        }

        return insideAttribute;

    }

    private processAttributes(attributes: string[]) {

        const attributesString = attributes.join(" ")

        const attributeParser = new AttributeParser(attributesString)
        return attributeParser.start()
        
    }

}

