import {Attribute, Input, NodeToken, Output, Reference, TemplateAttr, Token, Variable} from "../types/types";
import {AttributeParser} from "../attr-parser/attribute-parser";
import {SourcePosition, SourceSpan} from "../../../sourcespan/sourceSpan";

const SVG_TAG_REWRITE: Record<string, string> = {
    clippath: 'clipPath',
    lineargradient: 'linearGradient',
    radialgradient: 'radialGradient',
    foreignobject: 'foreignObject',
};

const templatesNodeNames = ["@if", "@for", "@else", "@elseif", "@empty", "@case", "@switch", "@default", "@while"];

const chars = {
    // {
  LBRACKET: "{",

    // }
  RBRACKET: "}",

    // (
  LPAREN: "(",

    // )
  RPAREN: ")",

  AT: "@",

    // <
  LT: "<",
  RT: ">",
  EMPTY_SPACE: " "
};

export class Tokenizer {
    private offset: number = 0;
    private line: number = 0;
    private column: number = 0;

    constructor(private html: string) {}

    public static getInstance(html: string): Tokenizer {
        return new Tokenizer(html)
    }

    public start() {

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

            const startPosition = this.createSourcePosition()
            this.advance(char);

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
            if (char === chars.LT && !openTag && !isExpression) {

                if (textBuffer.length) {
                    tokens.push({
                        name: textBuffer,
                        type: "text",
                        span: this.createSpan(startPosition)
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
                            type: "node",
                            span: this.createSpan(startPosition)
                        })

                        if (pushNgTemplateCloseTag > 0) {
                            pushNgTemplateCloseTag--;
                            this.pushNodeToken(tokens, {
                                name: "ng-template",
                                endTag: true,
                                type: "node",
                                span: this.createSpan(startPosition)
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
                            type: "node",
                            span: this.createSpan(startPosition)
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
                                type: "node",
                                span: this.createSpan(startPosition)
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
                index += 2;
                continue;
            }

            if (isExpression) {
                if (char == chars.RBRACKET && nextChar == chars.RBRACKET) {
                    index += 1;
                    isExpression = false;
                    tokens.push({
                        name: expressionBuffer,
                        type: "expression",
                        span: this.createSpan(startPosition)
                    })
                    elementBuffer = "";
                    expressionBuffer = ""
                    textBuffer = ""
                    continue;
                }

                expressionBuffer += char;
                continue;
            }

            if (char === chars.AT && nextChar !== " " && !comment && !DOCTYPE) {
                templateName += char;
                collectTemplateName = true;
                continue;
            }

            if (collectTemplateName && (char === chars.LPAREN || char === " " || char === chars.LBRACKET)) {
                collectTemplateName = false;

                if (templatesNodeNames.includes(templateName)) {

                    let _char = char;
                    let expression = ""

                    // match till we reach ( or {
                    if (char === " ") {
                        index++;
                        while (index < this.html.length) {
                            let newChar = this.html[index];
                            this.advance(newChar)

                            if (newChar === "(") {
                                _char = newChar
                                break
                            }

                            if(newChar === "{") {
                                _char = newChar;
                                break;
                            }

                            if (newChar !== "(" && newChar !== "{" && newChar !== " ") {
                                throw "Template " + templateName + " must be followed by either ( or {"
                            }

                            if (index === this.html.length - 1) {
                                throw "Wrong/incomplete template format."
                            }

                            index += 1;
                        }

                    }

                    if (_char === "(") {
                        // collect expression
                        index += 1;
                        _char = this.html[index]

                        while (index < this.html.length) {

                            this.advance(_char);

                            if (_char === chars.RPAREN) {

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

                                    this.advance(newChar)

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

                        if (_char !== chars.LBRACKET) {
                            throw "Template " + templateName + " must be followed by either ( or {";
                        }

                    }

                    if(_char === chars.LBRACKET) {
                        this.pushNodeToken(tokens, {
                            name: templateName,
                            startTag: true,
                            blockParameters: this._consumeBlockParameters(expression),
                            endTag: false,
                            type: "templateSyntax",
                            span: this.createSpan(startPosition)
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

            if (char === chars.RBRACKET && templateSyntaxFoundNames && templateSyntaxCounter > 0) {
                this.pushNodeToken(tokens, {
                    endTag: true,
                    name: templateSyntaxFoundNames[templateSyntaxFoundNames.length - 1],
                    startTag: false,
                    type: "templateSyntax",
                    blockParameters: [],
                    span: this.createSpan(startPosition)
                });
                templateSyntaxFoundNames = templateSyntaxFoundNames.slice(0);
                templateSyntaxCounter--;
                continue
            }

            // TEXT
            if (char !== "\n") {
                textBuffer += char;
            }

        }

        // push remaining text
        if (textBuffer.length) {
            tokens.push({
                name: textBuffer,
                type: "text",
                span: this.createSpan({column: 0, line: 0, offset: 0})
            });
        }

        tokens.push({
            name: "EOF",
            type: "EOF",
            span: this.createSpan({column: 0, line: 0, offset: 0})
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
            this.advance(char);

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

        if (!attrString) return {
            attributes: [],
            templateAttrs: [],
            inputs: [],
            outputs: [],
            references: [],
            variables: []
        } as {attributes: Attribute[], inputs: Input[], outputs: Output[], references: Reference[], templateAttrs: TemplateAttr[], variables: Variable[]};

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

    _consumeBlockParameters(expression: string) {

        const blockParameters = [];
        let inQuote: number | null = null;
        let openParens = 0;

        let start = 0

        for (let i = 0; i < expression.length; i++) {

            const char = expression.charAt(i);
            this.advance(char);

            if (char === ";") {
                blockParameters.push(expression.substring(start, i).trim());
                start = i + 1;
            }

            if (i === expression.length - 1) {
                blockParameters.push(expression.substring(start, i + 1).trim());
            }

        }

        return blockParameters;

    }

    createSourcePosition() {
        return {
            offset: this.offset,
            line: this.line,
            column: this.column
        }
    }

    private createSpan(start: SourcePosition): SourceSpan {
        return {
            text: start.column + " " + start.offset + " " + start.line,
            textEnd: this.offset + " line: " + this.line + " column:" + this.column + " ",
            start,
            end: {
                offset: this.offset,
                line: this.line,
                column: this.column
            }
        };
    }

    private advance(char: string) {
        this.offset++;
        if (char === '\n') {
            this.line++;
            this.column = 1;
        } else {
            this.column++;
        }
    }

}

