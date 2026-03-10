import { Token, TokenNodeType, Attributes } from "./types";
import { AttributeParser } from "./attributeParser";
import { nextChar } from "./utils";

export class Tokenizer {
  private openTag = false;
  private DOCTYPE = false;
  private collectAttrs = false;
  private comment = false;
  private attrs: string = "";
  private elementName: string = "";
  private textBuffer: string = "";
  private tokens: Token[] = [];
  private html: string = "";

  constructor(html: string) {
    this.html = html;
  }

  tokenize(): Token[] {
    for (let i = 0; i < this.html.length; i++) {
      const char = this.html[i];
      const nChar = nextChar(this.html, i);

      if (char === "<" && !this.openTag) {
        if (nChar === "!") {
          if (this.html[i + 2] === "-") {
            this.comment = true;
            continue;
          } else if (this.html[i + 2] === "D") {
            this.DOCTYPE = true;
            continue;
          }
        }

        this.openTag = true;
        continue;
      }

      if (this.comment) {
        if (char === "-" && nChar === ">") {
          this.comment = false;
          continue;
        }
        continue;
      }

      if (this.DOCTYPE) {
        if (char === ">") {
          this.DOCTYPE = false;
          continue;
        }
        continue;
      }

      if (this.openTag) {
        if (this.collectAttrs) {
          this.attrs += char;
          if (nChar === ">") {
            this.collectAttrs = false;
          }
          continue;
        }

        if (char === " " && !this.collectAttrs) {
          this.collectAttrs = true;
          continue;
        }

        if (char === ">") {
          const attributes = this.processAttr(this.attrs);

          if (this.elementName.startsWith("/")) {
            this.tokens.push({
              id: cryptoId(),
              index: this.tokens.length,
              name: this.elementName,
              startTag: false,
              endTag: true,
              attributes,
              type: TokenNodeType.Node,
            });
            this.attrs = "";
          } else {
            this.tokens.push({
              id: cryptoId(),
              index: this.tokens.length,
              name: this.elementName,
              startTag: true,
              endTag: false,
              attributes,
              type: TokenNodeType.Node,
            });
            this.attrs = "";
          }

          this.elementName = "";
          this.openTag = false;
          continue;
        }

        this.elementName += char;
      }

      if (!this.openTag && !this.DOCTYPE) {
        this.textBuffer += char;
        if (nChar === ">" || nChar === "<") {
          this.tokens.push({
            id: cryptoId(),
            index: this.tokens.length,
            name: this.textBuffer,
            startTag: false,
            endTag: false,
            type: TokenNodeType.Text,
          });
          this.textBuffer = "";
          continue;
        }
      }
    }

    return this.tokens;
  }

  private processAttr(attrs: string): Attributes[] {
    const attrParser = new AttributeParser(attrs);
    return attrParser.start();
  }
}

function cryptoId(): string {
  try {
    // Node 14.17+ / modern runtimes
    // @ts-ignore
    if (typeof crypto !== 'undefined' && typeof (crypto as any).randomUUID === 'function') {
      // @ts-ignore
      return (crypto as any).randomUUID();
    }
  } catch (e) {}
  // fallback
  return Math.random().toString(36).slice(2, 10);
}
