import { Attributes } from "./types";
import { containsQuotes } from "./utils";

export class AttributeParser {
  private attr: string;
  private attrs: Attributes[] = [];

  constructor(attr: string) {
    this.attr = attr;
  }

  start(): Attributes[] {
    const tokens = this.tokenize();
    let index = 0;

    while (index < tokens.length) {
      const token = tokens[index];
      const nextToken = this.peek(tokens, index + 1);

      if (token === "=") {
        const name = tokens[index - 1];
        this.attrs.push({ name, value: nextToken });
        index += 2;
        continue;
      }

      if (nextToken !== "=" && token !== "=" && tokens[index - 1] !== "=" && token !== tokens[index - 1]) {
        this.attrs.push({ name: token });
      }

      index += 1;
    }

    return this.attrs;
  }

  private peek(tokens: string[], i: number): string {
    if (i >= 0 && i < tokens.length) return tokens[i];
    return "";
  }

  tokenize(): string[] {
    let seenQuotes = false;
    const out: string[] = [];
    let concat = "";

    for (const ch of this.attr) {
      if (containsQuotes(ch) && !seenQuotes) {
        seenQuotes = true;
      } else if (containsQuotes(ch) && seenQuotes) {
        seenQuotes = false;
      }

      if (ch === ' ' && !seenQuotes) {
        out.push(concat);
        concat = "";
        continue;
      }

      if (ch === '=' && !seenQuotes) {
        out.push(concat);
        out.push('=');
        concat = "";
        continue;
      }

      concat += ch;
    }

    out.push(concat);

    return out.filter((s) => s.length > 0);
  }
}
