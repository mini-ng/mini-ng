import {ElementNode, NodeType, TextNode, Token} from "../types/types";
import {SELF_CLOSING_LINKS} from "../utils/constants";
import {removeElements} from "../utils/remove-elements";

export class Sojourn {

    constructor(private readonly tokens: Token[]) {}

    public start() {
        return this.sojourn(this.tokens)
    }

    private sojourn(tokens: Token[]) {

        const rootNodes = [];

        for (let i = 0; i < tokens.length; i++) {

            const token = tokens[i];
            const tokenName = token.name;
            const tokenType = token.type;

            // if its a node .
            // find its closing tag
            if (tokenType === "node" && !tokenName?.startsWith("/")) {

                const elementNode = new ElementNode(tokenName, token?.attributes, [])

                const {
                    children,
                    closingTagIndex,
                    selfClosing
                } = this.findTokenClosingTag(token, i, tokens)

                if (!selfClosing) {
                    tokens = removeElements(i + 1, closingTagIndex as number, tokens);
                    elementNode.children = this.sojourn(children);
                }

                rootNodes.push(elementNode);

            }

            if (tokenType === "text") {
                // convert to Text Node
                rootNodes.push(new TextNode(tokenName));
            }

        }

        return rootNodes

    }

    private findTokenClosingTag(token: Token, currentTokenIndex: number, tokens: Token[]) {

        const tokenName = token?.name;
        const children = []
        let closingTagIndex;
        let startPushingChildren = false;

        if (SELF_CLOSING_LINKS?.includes(token.name)) {
            return {
                closingTagIndex: currentTokenIndex + 1,
                children: [],
                selfClosing: true,
            }
        }

        for (let i = 0; i < tokens.length; i++) {

            const currentToken = tokens[i]

            if (i === currentTokenIndex) {

                if (currentToken?.name === token?.name) {
                    startPushingChildren = true;
                }

                continue

            }

            if (currentToken.name === "/" + tokenName) {

                closingTagIndex = i
                startPushingChildren = false;

                break;

            } else {

                if (startPushingChildren) {
                    children.push(currentToken)
                }

            }

        }

        if (!closingTagIndex && !children.length) {
            // no closing tag found.
            console.log("no closing tag found.", tokenName)
        }

        return {
            closingTagIndex,
            children
        }

    }

}