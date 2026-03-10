import { Token, TokenNodeType, Node as DOMNode, NodeType, ElementData, Attributes } from "./types";
import { htmlTagNameFrom } from "./types";
import { SELF_CLOSING_LINKS } from "./constants";

export class Parser {
  start(tokens: Token[]): DOMNode[] {
    const rootNodes: DOMNode[] = [];
    let index = 0;

    while (index < tokens.length) {
      const token = tokens[index];

      if (token.type === TokenNodeType.Text) {
        rootNodes.push({ id: token.id, children: [], nodeType: { kind: "text", value: token.name } });
      }

      if (token.type === TokenNodeType.Node && !token.name.startsWith("/")) {
        const nextTokens = index + 1 >= tokens.length - 1 ? [] : tokens.slice(index + 1, tokens.length);

        const uuid = this.findClosingTag(nextTokens, token.name);

        let childrenTokens: Token[] = [];
        let closingIndex: number = index;

        if (uuid) {
          const found = tokens.findIndex((t) => t.id === uuid);
          if (found !== -1) {
            closingIndex = found;
            childrenTokens = tokens.slice(index + 1, closingIndex);
          }
        }

        const children = this.start(childrenTokens);

        const attributesMap: Record<string, string> = {};
        if (token.attributes) {
          for (const attribute of token.attributes) {
            attributesMap[attribute.name] = attribute.value ?? "";
          }
        }

        const element = {
          id: cryptoId(),
          children,
          nodeType: { kind: "element", value: { tagName: htmlTagNameFrom(token.name), attributes: attributesMap } as ElementData },
        } as DOMNode;

        rootNodes.push(element);

        index = closingIndex + 1;
        continue;
      }

      index += 1;
    }

    return rootNodes;
  }

  findClosingTag(tokens: Token[], nodeName: string): string | null {
    const closingToken = tokens.find((t) => t.name === "/" + nodeName);
    if (!closingToken) {
      if (SELF_CLOSING_LINKS.has(nodeName)) return null;
      return null;
    }
    return closingToken.id;
  }
}

function cryptoId(): string {
  try {
    // @ts-ignore
    if (typeof crypto !== 'undefined' && typeof (crypto as any).randomUUID === 'function') {
      // @ts-ignore
      return (crypto as any).randomUUID();
    }
  } catch (e) {}
  return Math.random().toString(36).slice(2, 10);
}
