import {Token} from "../types/types";
import {AttributeParser} from "../attr-parser/attribute-parser";
import {isExpression} from "typescript";

const SVG_TAG_REWRITE: Record<string, string> = {
    clippath: 'clipPath',
    lineargradient: 'linearGradient',
    radialgradient: 'radialGradient',
    foreignobject: 'foreignObject',
};

export class Tokenizer {

    constructor(private html: string) {}

    public static getInstance(html: string): Tokenizer {
        return new Tokenizer(html)
    }

    public start() {

        // remove newlines
        this.html = this.html.replace(/\n/g, "");

        let openTag = false;
        let comment = false;
        let DOCTYPE = false;
        let isExpression = false;

        let elementBuffer = "";
        let textBuffer = "";
        let expressionBuffer = ""

        const tokens: Token[] = [];

        for (let index = 0; index < this.html.length; index++) {

            const char = this.html[index];
            const nextChar = this.html[index + 1];

            // COMMENT START
            if (!openTag && !comment && this.html.startsWith("<!--", index)) {
                comment = true;
                index += 3;
                continue;
            }

            // COMMENT BODY
            if (comment) {
                if (this.html.startsWith("-->", index)) {
                    comment = false;
                    index += 2;
                }
                continue;
            }

            // DOCTYPE
            if (!openTag && this.html.startsWith("<!DOCTYPE", index)) {
                DOCTYPE = true;
                index += 8;
                continue;
            }

            if (DOCTYPE) {
                if (char === ">") {
                    DOCTYPE = false;
                }
                continue;
            }

            // TAG OPEN
            if (char === "<" && !openTag) {

                if (textBuffer.length) {
                    tokens.push({
                        name: textBuffer,
                        type: "text"
                    });
                    textBuffer = "";
                }

                openTag = true;
                elementBuffer = "";
                continue;
            }

            // TAG PARSING
            if (openTag) {

                elementBuffer += char;

                if (nextChar === ">" && !this.isInsideAttributeValue(elementBuffer)) {

                    let content = elementBuffer.trim();

                    let selfClosing = false;

                    if (content.endsWith("/")) {
                        selfClosing = true;
                        content = content.slice(0, -1).trim();
                    }

                    // END TAG
                    if (content.startsWith("/")) {

                        this.pushNodeToken(tokens, {
                            name: content.slice(1),
                            endTag: true,
                            type: "node"
                        })

                    } else {

                        // extract element name
                        const firstSpace = content.indexOf(" ");

                        let name = content;
                        let attrString = "";

                        if (firstSpace !== -1) {
                            name = content.slice(0, firstSpace);
                            attrString = content.slice(firstSpace + 1);
                        }

                        const attributes = this.processAttributes(attrString);

                        this.pushNodeToken(tokens, {
                            name,
                            attributes,
                            startTag: true,
                            selfClosing,
                            type: "node"
                        })

                    }

                    elementBuffer = "";
                    openTag = false;

                    index++;
                    continue;
                }

                continue;
            }

            if (!comment && !openTag && !DOCTYPE && this.html.startsWith("{{", index)) {
                isExpression = true;
                index += 1;
                continue;
            }

            if (isExpression) {
                if (this.html.startsWith("}}", index)) {
                    index += 1;
                    isExpression = false;
                    tokens.push({
                        name: expressionBuffer,
                        type: "expression"
                    })
                    continue;
                }

                expressionBuffer += char;
                continue;
            }

            // TEXT
            textBuffer += char;

        }

        // push remaining text
        if (textBuffer.length) {
            tokens.push({
                name: textBuffer,
                type: "text"
            });
        }

        tokens.push({
            name: "EOF",
            type: "EOF"
        });

        return tokens.map((token, index) => ({
            index,
            ...token
        }));
    }

    private isInsideAttributeValue(str: string) {

        let quote: string | null = null;

        for (let i = 0; i < str.length; i++) {

            const char = str[i];

            if (!quote && (char === '"' || char === "'")) {
                quote = char;
                continue;
            }

            if (quote && char === quote) {
                quote = null;
            }

        }

        return quote !== null;
    }

    private processAttributes(attrString: string) {

        if (!attrString) return [];

        const parser = new AttributeParser(attrString);
        return parser.start();
    }

    private pushNodeToken(tokens: Token[], token: Token) {
        token.name = this.rewriteTagExactDomName(token.name)
        tokens.push(token)
    }

    rewriteTagExactDomName(tag: string) {
        return SVG_TAG_REWRITE[tag] ?? tag;
    }

}

