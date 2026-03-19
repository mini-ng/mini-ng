import {NodeToken, TemplateSyntaxNode, Token, Variable} from "../types/types";
import {BoundText, cloneNode, Document, Element, Template, Text} from "../../../nodes";
import {HTMLExpressionParser} from "../../../expression_parser/parser";
import {HTMLExpressionTokenizer} from "../../../expression_parser/expr_tokenizer";
import {
    CaseNode,
    DefaultNode,
    ElseBlock, ElseIfBlock,
    ForLoopBlock,
    ForLoopBlockEmpty,
    IfBlock,
    SwitchNode
} from "../../../syntax-ast";
import {parseMicroSyntax} from "../../../../node-generation/node-generation";
import {BoundAttribute, BoundEvent, HtmlReference, HtmlVariable} from "../../../ast/html-ast";

interface ClosingResult {
    closingIndex?: number;
    children: Token[];
    selfClosing: boolean;
}

export class Sojourn {

    constructor(private readonly tokens: Token[]) {}

    public start() {
        const doc = new Document([]);
        const nodes = this.walk(this.tokens, doc);
        doc.childNodes = nodes;
        return doc;
    }

    // 🔥, here we walk 🚶🏼
    private walk(tokens: Token[], parent?: any) {

        const nodes: any[] = [];
        let prev: any = null;

        for (let i = 0; i < tokens.length; i++) {

            const token = tokens[i];

            if (token.type === "EOF") break;

            // TEXT NODE
            if (token.type === "text") {

                const textNode = cloneNode(new Text(token.name));

                textNode.parent = parent;
                textNode.prev = prev;

                if (prev) prev.next = textNode;

                nodes.push(textNode);
                prev = textNode;

                continue;
            }

            // EXPRESSION NODE -> a Bound text
            if (token.type === "expression") {

                const ast = this.parse(token.name);
                const boundTextNode = new BoundText(token.name, ast);

                boundTextNode.parent = parent;
                boundTextNode.prev = prev;

                if (prev) prev.next = boundTextNode;

                nodes.push(boundTextNode);
                prev = boundTextNode;

                continue;
            }

            if (token.type === "templateSyntax" && token.startTag) {

                const { children, closingIndex, selfClosing } =
                    this.findTemplateSyntaxClosing(token, i, tokens);

                if (closingIndex !== undefined) {
                    i = closingIndex;
                }

                // if template syntax is @for, check for @empty
                if (token.name === "@for") {

                    let forNode = new ForLoopBlock(null, null, null, null, [], null);
                    this.parseForNode(forNode, token);

                    let emptyNode;

                    for (let j = closingIndex + 1; j < tokens.length; j++) {

                        const current = tokens[j];
                        // if empty text, we skip
                        // if next non-empty text is node and not @empty node we return immediately

                        if (current.type === "text" && current.name.trim().length == 0) {
                            continue;
                        }

                        if (current.type === "templateSyntax" && current.name === "@empty" && current.startTag) {

                            emptyNode = new ForLoopBlockEmpty([]);

                            // walk for empty
                            const {
                                children: emptyChildren,
                                closingIndex: emptyClosingIndex
                            } = this.findTemplateSyntaxClosing(current, j, tokens);

                            forNode.empty = emptyNode;

                            if (emptyChildren.length) {
                                emptyNode.children = this.walk(emptyChildren, emptyNode);
                                emptyNode.childNodes = emptyNode.children
                            }

                            // move i forward so @empty is not reprocessed
                            i = emptyClosingIndex + 1;
                            break;

                        } else break
                    }

                    if (!selfClosing && children.length) {
                        forNode.children = this.walk(children, forNode);
                        forNode.childNodes = forNode.children
                    }

                    nodes.push(forNode);
                }

                // @switch will have @case(s) and @default as children
                if (token.name === "@switch") {

                    // @case(s) and @default will be children
                    const cases = []
                    const switchNode = new SwitchNode([], null, cases, null)

                    const expr = this.parse(token.expression)
                    switchNode.expression = expr

                    if (children.length) {

                        switchNode.children = this.walk(children, switchNode);
                        switchNode.childNodes = switchNode.children

                        switchNode.childNodes.forEach(child => {
                            if (child instanceof CaseNode) {
                                cases.push(child);
                            } else if (child instanceof DefaultNode) {
                                switchNode.defaultNode = child
                            } else {
                                throw new Error("Invalid node in @switch.")
                            }
                        })
                    }

                    switchNode.cases = cases

                    nodes.push(switchNode)
                    continue

                }

                if (token.name === "@case") {
                    const caseNode = new CaseNode([], null);
                    const expr = this.parse(token.expression)
                    caseNode.expression = expr

                    if (children.length) {
                        caseNode.children = this.walk(children, caseNode);
                        caseNode.childNodes = caseNode.children
                    }

                    nodes.push(caseNode);
                    continue;

                }

                if (token.name === "@default") {
                    const defaultNode = new DefaultNode([]);

                    if (children.length) {
                        defaultNode.children = this.walk(children, defaultNode);
                        defaultNode.childNodes = defaultNode.children
                    }

                    nodes.push(defaultNode);
                    continue;

                }

                // @if, next node maybe @elseif(s) or @else
                if (token.name === "@if") {

                    // search for @elseif(s) and @else
                    const expr = this.parse(token.expression)
                    const ifNode = new IfBlock(expr, [], null, null);
                    const elseIfs: ElseIfBlock[] = []

                    for (let j = closingIndex + 1; j < tokens.length; j++) {

                        const current = tokens[j];

                        // if empty text, we skip
                        // if next non-empty text is node and not @elseif or @else node we return immediately

                        if (current.type === "text" && current.name.trim().length == 0) {
                            continue;
                        }

                        if (current.type === "templateSyntax" && (current.name === "@elseif" || current.name === "@else") && current.startTag) {

                            const elseOrElseIfNode: ElseBlock | IfBlock = current.name === "@elseif" ? new ElseIfBlock(null, []) : new ElseBlock(null, []);

                            const {
                                children: elseChildren,
                                closingIndex: elseClosingIndex
                            } = this.findTemplateSyntaxClosing(current, j, tokens);

                            if (elseChildren.length) {
                                elseOrElseIfNode.children = this.walk(elseChildren, elseOrElseIfNode);
                                elseOrElseIfNode.childNodes = elseOrElseIfNode.children
                            }

                            const expr = this.parse(token.expression)
                            elseOrElseIfNode.expression = expr

                            if (elseOrElseIfNode instanceof ElseIfBlock) {
                                elseIfs.push(elseOrElseIfNode)
                            } else {
                                ifNode.elseBranch = elseOrElseIfNode
                            }

                            i = elseClosingIndex + 1;
                            j = i;

                        } else break
                    }

                    if (!selfClosing && children.length) {
                        ifNode.children = this.walk(children, ifNode);
                        ifNode.childNodes = ifNode.children
                    }

                    ifNode.branches = elseIfs

                    nodes.push(ifNode)

                }

                continue;

            }

            // ELEMENT NODE
            if (token.type === "node" && token.startTag) {

                const attribs: Record<string, string> = {};

                token.attributes?.forEach(attr => {
                    attribs[attr.name] = attr.value;
                });

                const inputs: BoundAttribute[] = [];
                token.inputs.forEach(input => {
                    // check if the attribute is "Property" | "Attribute" | "Class" | "Style"
                    inputs.push(new BoundAttribute(
                        input.type, input.name, this.parse(input.value), undefined
                    ))
                })

                const outputs: BoundEvent[] = [];
                token.outputs.forEach(output => {
                    outputs.push( new BoundEvent(
                        output.name, this.parse(output.value),
                ))
                });

                const references: HtmlReference[] = []
                token.references.forEach(reference => {
                    references.push(new HtmlReference(reference.name, reference.value))
                });

                let element: Element | Template

                if (token.name === "ng-template") {

                    const templateAttrs: BoundAttribute[] = [];
                    token.templateAttrs.forEach(attr => {
                        templateAttrs.push(new BoundAttribute(attr.type, attr.name, this.parse(attr.value), undefined))
                    });

                    const variables: HtmlVariable[] = []
                    token.variables.forEach(variable => {
                        variables.push(new HtmlVariable(variable.name, variable.value))
                    });

                    // create TemplateNode
                    element = cloneNode(
                        new Template(token.name, attribs, inputs, outputs, references, templateAttrs, variables, [])
                    );

                } else {
                    element = cloneNode(
                        new Element(token.name, attribs, inputs, outputs, references, [])
                    );
                }

                const { children, closingIndex, selfClosing } =
                    this.findClosingTag(token, i, tokens);

                if (!selfClosing && children.length) {
                    element.children = this.walk(children, element);
                    element.childNodes = element.children
                }

                element.parent = parent;
                element.prev = prev;

                if (prev) prev.next = element;

                nodes.push(element);
                prev = element;

                if (closingIndex !== undefined) {
                    i = closingIndex;
                }

                continue;
            }

        }

        return nodes;
    }

    private findClosingTag(
        token: NodeToken,
        startIndex: number,
        tokens: Token[]
    ): ClosingResult {

        if (token.selfClosing) {
            return {
                selfClosing: true,
                children: [],
                closingIndex: startIndex
            };
        }

        const children: Token[] = [];
        const name = token.name;

        let depth = 0;

        for (let i = startIndex + 1; i < tokens.length; i++) {

            const current = tokens[i];

            if (current.type !== "node") {
                children.push(current);
                continue;
            }

            // same nested tag
            if (current.startTag && current.name === name) {
                depth++;
                children.push(current);
                continue;
            }

            // closing tag
            if (current.endTag && current.name === name) {

                if (depth === 0) {
                    return {
                        closingIndex: i,
                        children,
                        selfClosing: false
                    };
                }

                depth--;
                children.push(current);
                continue;
            }

            children.push(current);
        }

        return {
            closingIndex: undefined,
            children,
            selfClosing: false
        };
    }

    private findTemplateSyntaxClosing(
        token: TemplateSyntaxNode,
        startIndex: number,
        tokens: Token[]
    ): ClosingResult {

        const children: Token[] = [];
        const name = token.name;

        let depth = 0;

        for (let i = startIndex + 1; i < tokens.length; i++) {

            const current = tokens[i];

            if (current.type !== "templateSyntax") {
                children.push(current);
                continue;
            }

            // same nested tag
            if (current.startTag && current.name === name) {
                depth++;
                children.push(current);
                continue;
            }

            // closing tag
            if (current.endTag && current.name === name) {

                if (depth === 0) {
                    return {
                        closingIndex: i,
                        children,
                        selfClosing: false
                    };
                }

                depth--;
                children.push(current);
                continue;
            }

            children.push(current);
        }

        return {
            closingIndex: undefined,
            children,
            selfClosing: false
        };

    }

    parse(expr: string) {

        const tokenizer = HTMLExpressionTokenizer.instance()
        const tokens = tokenizer.tokenize(expr);

        const parser = HTMLExpressionParser.instance(tokens)
        return { ast: parser.start(), source: expr };

    }

    private parseForNode(forNode: ForLoopBlock, token: TemplateSyntaxNode) {
        const expression = token.expression

        // check the middle is "of"
        const result = parseMicroSyntax("@for", expression)

    }
}
