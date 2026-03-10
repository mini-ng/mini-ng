import { Token, TokenNodeType } from "./types";

export class TokenToHTML {
  private html = "";

  convertToHTML(tokens: Token[]): string {
    for (const token of tokens) {
      if (token.type === TokenNodeType.Text) {
        this.html += token.name;
      }

      if (token.type === TokenNodeType.Node) {
        this.html += `<${token.name}>`;
      }
    }

    return this.html;
  }
}
