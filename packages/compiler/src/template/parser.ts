import ts = require("typescript");
import { ViewGenerator } from "./view_generator";
import {factory} from "typescript";
import {HtmlAstVisitor, HtmlAstVisitorImpl} from "../html_parser/ast/html-ast";

const parseConfig = {
  lowerCaseTagName: false, // convert tag name to lower case (hurts performance heavily)
  comment: false, // retrieve comments (hurts performance slightly)
  voidTag: {
    tags: [
      "area",
      "base",
      "br",
      "col",
      "embed",
      "hr",
      "img",
      "input",
      "link",
      "meta",
      "param",
      "source",
      "track",
      "wbr",
    ], // optional and case insensitive, default value is ['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr']
    closingSlash: true, // optional, default false. void tag serialisation, add a final slash <br/>
  },
  blockTextElements: {
    script: true, // keep text content when parsing
    noscript: true, // keep text content when parsing
    style: true, // keep text content when parsing
    pre: true, // keep text content when parsing
  },
};

const CREATE = "1";
const UPDATE = "2";

export class Parser {

  template: string;

  constructor(template: string) {
    this.template = template;
  }

  parse() {

    const html = this.template;

    const generator = new ViewGenerator();
    const htmlVisitor = new HtmlAstVisitorImpl();
    const { stmts, updateStmts, consts, templateStmts, outsideStatements } = htmlVisitor.generateView(html);

    // const { stmts, updateStmts, consts, templateStmts, outsideStatements } = generator.generateViewCode(html);


   const creationNode = ts.factory.createIfStatement(
       factory.createBinaryExpression(
        ts.factory.createIdentifier("rf"),
           ts.SyntaxKind.AmpersandToken,
        ts.factory.createIdentifier(CREATE)
      ),
      ts.factory.createBlock([...stmts], true),
      undefined
    );

   const updateNode = factory.createIfStatement(
       factory.createBinaryExpression(
           factory.createIdentifier("rf"),
           ts.SyntaxKind.AmpersandToken,
           factory.createIdentifier(UPDATE)
       ),
       factory.createBlock([...updateStmts], true),
       undefined
   )

    return {
        block: ts.factory.createBlock([creationNode, updateNode], true),
        consts: consts,
        templateStmts: templateStmts,
        outsideStatements
    }

  }
}
