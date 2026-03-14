import {NodeToken, Token} from "../types/types";
import {cloneNode, Document, Element, Text} from "../../../nodes";

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
                continue;
            }

            // ELEMENT NODE
            if (token.type === "node" && token.startTag) {

                const attribs: Record<string, string> = {};

                token.attributes?.forEach(attr => {
                    attribs[attr.name] = attr.value;
                });

                const element = cloneNode(
                    new Element(token.name, attribs, [])
                );

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
}

// export class SojournV2 {
//
//     constructor(private tokens: Token[]) {}
//
//     public start() {
//         const doc = new Document([]);
//         const rootNodes = this.sojourn(this.tokens, doc);
//         doc.childNodes = rootNodes;
//         return doc;
//     }
//
//     private sojourn(tokens: Token[], parent?: ParentNode): ChildNode[] {
//         const rootNodes: ChildNode[] = [];
//         let prev: ChildNode | null = null;
//
//         for (let i = 0; i < tokens.length; i++) {
//             const token = tokens[i];
//
//             // Track previous node
//             if (i !== 0) prev = rootNodes[rootNodes.length - 1];
//
//             if (token.type === "node" && token.startTag && !token.endTag) {
//                 const attribs: { [key: string]: string } = {};
//                 token.attributes?.forEach(attr => {
//                     attribs[attr.name] = attr.value;
//                 });
//
//                 const elNode = new Element(token.name, attribs, []);
//                 elNode.parent = parent ?? null;
//                 elNode.prev = prev;
//                 if (prev) prev.next = elNode;
//
//                 // If self-closing, skip recursion
//                 if (!token.selfClosing) {
//                     // Find children until corresponding closing tag
//                     const { children, closingTagIndex } = this.findTokenClosingTag(token, i, tokens);
//                     elNode.children = this.sojourn(children, elNode);
//                     elNode.childNodes = elNode.children;
//
//                     // Remove processed tokens from the list
//                     tokens = tokens.slice(0, i + 1).concat(tokens.slice(closingTagIndex + 1));
//                     i = i; // keep current index, children already processed
//                 }
//
//                 rootNodes.push(elNode);
//             } else if (token.type === "text") {
//                 const textNode = new Text(token.name);
//                 textNode.parent = parent ?? null;
//                 textNode.prev = prev;
//                 if (prev) prev.next = textNode;
//                 rootNodes.push(textNode);
//             }
//         }
//
//         return rootNodes;
//     }
//
//     private findTokenClosingTag(token: NodeToken, startIndex: number, tokens: Token[]): { children: Token[]; closingTagIndex: number } {
//         const children: Token[] = [];
//         let depth = 0;
//         let closingTagIndex = tokens.length - 1;
//
//         for (let i = startIndex + 1; i < tokens.length; i++) {
//             const t = tokens[i];
//
//             if (t.type === "node") {
//                 if (t.startTag && t.name === token.name && !t.selfClosing) {
//                     depth++;
//                 } else if (t.endTag && t.name === token.name) {
//                     if (depth === 0) {
//                         closingTagIndex = i;
//                         break;
//                     } else {
//                         depth--;
//                     }
//                 }
//             }
//
//             if (depth >= 0) children.push(t);
//         }
//
//         return { children, closingTagIndex };
//     }
//
// }
