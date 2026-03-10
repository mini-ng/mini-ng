import { Tokenizer } from "./tokenizer";
import { Parser } from "./parser";
import { Node } from "./types";

export class HTMLParser {
  start(html: string): Node[] {
    const tokenizer = new Tokenizer(html);
    const tokens = tokenizer.tokenize();

    const parser = new Parser();
    const nodes = parser.start(tokens);

    return nodes;
  }
}

export default HTMLParser;
