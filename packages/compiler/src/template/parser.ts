import ts = require("typescript");
import { ViewGenerator } from "./view_generator";
import {factory} from "typescript";
import {HtmlAstVisitorImpl} from "../html_parser/visitor/html-visitor";
import {compileComponentFromMetadata} from "../r3/r3_compiler";
import {CompilationJob} from "../ir/compilation";
import {OpKind} from "../ir/ir";
import {ExpressionTranslatorVisitor} from "../transformer/translator";
import {ImportGenerator} from "../transformer/import-generator/import-generator";
import {AstFactory} from "../transformer/ast-factory/ast-factory";

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

  constructor(template: string, public componentName: string) {
    this.template = template;
  }

  parse() {

      const html = this.template;

      // const generator = new ViewGenerator();
      const htmlVisitor = new HtmlAstVisitorImpl();
      const {stmts, updateStmts, consts, templateStmts, outsideStatements} = {
          outsideStatements: [],
          stmts: [],
          updateStmts: [],
          consts: [],
          templateStmts: []
      } //htmlVisitor.generateView(html);

      // const { stmts, updateStmts, consts, templateStmts, outsideStatements } = generator.generateViewCode(html);

      const importManager = new ImportGenerator();
      const astFactory = new AstFactory();
      const visitor = new ExpressionTranslatorVisitor(astFactory, importManager)

      const job: CompilationJob = compileComponentFromMetadata(html, this.componentName);
      for (const unit of job.units) {
          let current = unit.create.head.next;
          const tail = unit.create.tail;
          while (current !== tail) {

              try {

                  // @ts-ignore
                  // console.log(current?.statement?.expr)
                  // @ts-ignore
                  stmts.push(current.statement.visitStatement(visitor))
              } catch (e) {
                  // console.log(current, e,);
              }

              current = current.next;
          }

          let currentUpdate = unit.update.head.next;
          const tailUpdate = unit.update.tail;
          console.log("=======update=========", this.componentName)

          while (currentUpdate !== tailUpdate) {
              const {next, prev, ...printable} = currentUpdate;

              // @ts-ignore
              // console.log(currentUpdate?.statement)

              try {
                  // @ts-ignore
                  updateStmts.push(currentUpdate.statement.visitStatement(visitor))
              } catch (e) {
                  // @ts-ignore
                  // console.error(currentUpdate?.statement);
              }

              currentUpdate = currentUpdate.next;
          }

      }

      const imports = importManager.finalize();
      outsideStatements.push(imports);

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
