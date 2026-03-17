import {Attribute, Input, NodeToken, Output, Reference, TemplateAttr, Token, Variable} from "../types/types";
import {AttributeParser} from "../attr-parser/attribute-parser";

const SVG_TAG_REWRITE: Record<string, string> = {
    clippath: 'clipPath',
    lineargradient: 'linearGradient',
    radialgradient: 'radialGradient',
    foreignobject: 'foreignObject',
};

const templatesNodeNames = ["@if", "@for", "@else", "@elseif", "@empty", "@case", "@switch", "@default", "@while"]

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

        let collectTemplateName = false
        let templateSyntaxCounter = 0;
        let templateSyntaxFoundNames = []

        let elementBuffer = "";
        let textBuffer = "";
        let expressionBuffer = ""

        let templateName = ""

        const tokens: Token[] = [];
        let pushNgTemplateCloseTag = 0;

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

                        if (pushNgTemplateCloseTag > 0) {
                            pushNgTemplateCloseTag--;
                            this.pushNodeToken(tokens, {
                                name: "ng-template",
                                endTag: true,
                                type: "node"
                            })
                        }

                    } else {

                        // extract element name
                        const firstSpace = content.indexOf(" ");

                        let name = content;
                        let attrString = "";

                        if (firstSpace !== -1) {
                            name = content.slice(0, firstSpace);
                            attrString = content.slice(firstSpace + 1);
                        }

                        const { attributes, inputs, outputs, templateAttrs, references, variables } = this.processAttributes(attrString);

                        // check to see if there is a structural directive present in the attribute
                        const token: NodeToken = {
                            name,
                            attributes,
                            inputs,
                            outputs,
                            templateAttrs,
                            variables,
                            references,
                            startTag: true,
                            selfClosing,
                            type: "node"
                        };

                        if (templateAttrs && templateAttrs.length && name !== "ng-template") {

                            // push ng-template token
                            const ngTemplateToken: Token = {
                                name: "ng-template",
                                attributes,
                                inputs,
                                outputs,
                                templateAttrs,
                                variables: [],
                                references: [],
                                startTag: true,
                                selfClosing: false,
                                type: "node"
                            }

                            token.templateAttrs = [];
                            pushNgTemplateCloseTag++;

                            this.pushNodeToken(tokens, ngTemplateToken)
                        }

                        this.pushNodeToken(tokens, token)

                    }

                    elementBuffer = "";
                    openTag = false;

                    index++;
                    continue;
                }

                continue;
            }

            if (!comment && !openTag && !DOCTYPE && (char == "{" && nextChar == "{") /*this.html.startsWith("{{", index)*/) {
                isExpression = true;
                index += 1;
                continue;
            }

            if (isExpression) {
                if (char == "}" && nextChar == "}"/*this.html.startsWith("}}", index)*/) {
                    index += 1;
                    isExpression = false;
                    tokens.push({
                        name: expressionBuffer,
                        type: "expression"
                    })
                    elementBuffer = "";
                    expressionBuffer = ""
                    textBuffer = ""
                    continue;
                }

                expressionBuffer += char;
                continue;
            }

            if (char === "@" && nextChar !== " " && !comment && !DOCTYPE) {
                templateName += char;
                collectTemplateName = true;
                continue;
            }

            if (collectTemplateName && (char === "(" || char === " " || char === "{")) {
                collectTemplateName = false;

                if (templatesNodeNames.includes(templateName)) {

                    let _char = char;
                    let expression = ""

                    // match till we reach ( or {
                    if (char === " ") {
                        index++;
                        while (index < this.html.length) {
                            let newChar = this.html[index];

                            if (newChar === "(") {
                                // collectTemplateSyntaxInputs = true;
                                _char = newChar
                                break
                            }

                            if(newChar === "{") {
                                _char = newChar;
                                break;
                            }

                            if (newChar !== "(" && newChar !== "{" && newChar !== " ") {
                                throw ""
                            }

                            if (index === this.html.length - 1) {
                                throw ""
                            }

                            index += 1;
                        }

                    }

                    if (_char === "(") {
                        // collect expression
                        index += 1;
                        _char = this.html[index]

                        while (index < this.html.length) {

                            if (_char === ")") {

                                if (this.html[index + 1] === "{") {
                                    index += 1;
                                    _char = this.html[index];
                                    break;
                                }

                                // consume to see if the next is "{"
                                let seq = "";
                                index += 1;
                                let newChar = this.html[index];

                                while (true) {

                                    if (newChar === "{" && seq.trim().length === 0) {
                                        _char = newChar;
                                        break
                                    }

                                    if (newChar !== " ") {
                                        expression += seq;
                                        break;
                                    }

                                    seq += newChar;

                                    index += 1;
                                    newChar = this.html[index];

                                }

                                if (_char === "{") break;
                            }

                            expression += _char;
                            index++;
                            _char = this.html[index];

                        }

                        templateSyntaxCounter++

                        if (_char !== "{") {
                            throw "";
                        }

                    }

                    if(_char === "{") {
                        this.pushNodeToken(tokens, {
                            name: templateName,
                            startTag: true,
                            expression,
                            endTag: false,
                            type: "templateSyntax",
                        });

                        templateSyntaxFoundNames.push(templateName);
                        templateSyntaxCounter++;
                        templateName = ""
                        continue
                    }

                    continue;

                } else  {
                    textBuffer += templateName;
                    templateName = ""
                }

            } else if (collectTemplateName) {
                templateName += char;
                continue
            }

            if (char === "}" && templateSyntaxFoundNames && templateSyntaxCounter > 0) {
                this.pushNodeToken(tokens, {
                    endTag: true,
                    name: templateSyntaxFoundNames[0],
                    startTag: false,
                    type: "templateSyntax",
                });
                templateSyntaxFoundNames = templateSyntaxFoundNames.slice(0);
                templateSyntaxCounter--;
                continue
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

        if (!attrString) return {} as {attributes: Attribute[], inputs: Input[], outputs: Output[], references: Reference[], templateAttrs: TemplateAttr[], variables: Variable[]};

        const parser = new AttributeParser(attrString);
        return parser.start();
    }

    private pushNodeToken(tokens: Token[], token: Token) {
        token.name = this.rewriteTagExactDomName(token.name)
        tokens.push(token)
    }

    private processTemplateSyntaxExpression(expression: string) {

    }

    rewriteTagExactDomName(tag: string) {
        return SVG_TAG_REWRITE[tag] ?? tag;
    }

}

