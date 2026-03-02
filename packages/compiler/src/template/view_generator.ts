import {parseDocument} from "htmlparser2";
import {Element, Node, Text} from "domhandler";
import {factory, SourceFile} from "typescript";
import {ExpressionParser} from "../expr_parser/expr_parser";
import {RenderFlags} from "../render/flags";
import {AttributeMarker} from "./attribute_marker";
import {
  $event,
  ctx,
  i0,
  ɵɵadvance,
  ɵɵconditional,
  ɵɵelementEnd,
  ɵɵelementStart,
  ɵɵlistener, ɵɵpipe, ɵɵpipeBind,
  ɵɵproperty,
  ɵɵrepeater,
  ɵɵrepeaterCreate,
  ɵɵtext,
  ɵɵtextInterpolate,
  ɵɵtextStyle
} from "../constants/constants";
import {CSSParser} from "../css_parser/css_parser";
import {ElementType} from "domelementtype";
import {replaceCustomDirectivesAndPipes} from "../expr_parser/html_string_to_template_ast";
import ts = require("typescript");

export interface ViewGeneratorOptions {
  // Add any configuration options here
}

type InterpolationType = {
  type: 'text' | 'expression' | 'statement',
  statement?: ts.ExpressionStatement;
  content?: string
}

const templatesNodeNames = ["ng-if", "ng-for", /*"ng-else", "ng-else-if",*/ /* "ng-empty", "ng-case", */ "ng-switch" /*, "ng-default"*/, "ng-while", "ng-template", "ng-for-empty"]
const SVG_TAG_REWRITE: Record<string, string> = {
  clippath: 'clipPath',
  lineargradient: 'linearGradient',
  radialgradient: 'radialGradient',
  foreignobject: 'foreignObject',
};

export type Template = {
  functionName: string;
  updateStmts: ts.ExpressionStatement[],
  stmts: ts.ExpressionStatement[],
  templateStmts: Template[]
}

export class ViewGenerator {
  private options: ViewGeneratorOptions;

  private readonly stmts: ts.ExpressionStatement[] = [];
  private readonly updateStmts: ts.ExpressionStatement[] = [];
  private readonly templateStmts: Template[] = []
  private consts: ts.Expression[] = [];
  private slot = 0;
  private index = 0;
  private readonly implicitVariables = []
  private skipNode: number  = -1;

  constructor(options: ViewGeneratorOptions = {}) {
    this.options = options;
    this.stmts = [];
    this.updateStmts = [];
    this.consts = [];
  }

  generateViewCode(html: string) {
    const ngHtmlString = replaceCustomDirectivesAndPipes(html)
    const document = parseDocument(ngHtmlString);
    const nodes = document.childNodes;

    let creationCode = "";
    let updateCode = "";

    for (; this.index < nodes.length; this.index++) {
      const node = nodes[this.index];

      if (node.type === ElementType.Comment) continue

      if (this.skipNode === this.index) { this.skipNode = -1; continue; }

      const { creation, update } = this.processNode(node, this.index);

      creationCode += creation;
      updateCode += update;
    }

    return {
      stmts: this.stmts,
      updateStmts: this.updateStmts,
      templateStmts: this.templateStmts,
      consts: this.consts,
      codeString: this.wrapCode(creationCode, updateCode),
    };
  }

  private processNode(
    node: Node,
    _: number
  ): { creation: string; update: string } {

    let index = this.slot++;

    if (node instanceof Element) {
      const tag = node.tagName;
      if(templatesNodeNames.includes(tag)) {
        return this.processTemplateElement(tag, node, index)
      }
      
      if (tag === "ng-pipe-chain") {
        return this.processPipe(node, index)
      }

      return this.processElement(node, index);
    } else if (node instanceof Text) {
      return this.processText(node, index);
    } else {
      return { creation: "", update: "" };
    }
  }

  rewriteTagExactDomName(tag: string) {
    return SVG_TAG_REWRITE[tag] ?? tag;
  }

  private processElement(
    element: Element,
    index: number
  ): { creation: string; update: string, attrArray: string[] } {
    const tag = this.rewriteTagExactDomName(element.tagName);
    const attributes = element.attribs;
    // const attrArray = [];
    let attrIndex;

    const tempStmts = [];
    const tempConstsStmts = []

    // Process attributes
    for (const attr in attributes) {
      if (attr.startsWith("(")) {
        // Event binding
        const eventName = attr.slice(1, -1);
        tempStmts.push(
            generateListenerNode(eventName, tag, index + 1, attributes[attr])
        )
      } else if (attr.startsWith("[")) {
        let attr_marker = AttributeMarker.Bindings;

        // Property binding
        const propertyName = attr.slice(1, -1);

        this.updateStmts.push(generateAdvanceNode(index.toString()));
        this.updateStmts.push(generatePropertyNode(propertyName, attributes[attr], this.implicitVariables));

        tempConstsStmts.push(
            ts.factory.createArrayLiteralExpression(
                [
                  ts.factory.createNumericLiteral(attr_marker),
                  ts.factory.createStringLiteral(propertyName)
                ]
            )
        )
        attrIndex = this.consts.length;

      } else {
        // attrArray.push(`"${attr}", "${attributes[attr]}"`);

        let attr_marker: AttributeMarker;

        switch (attr) {
          case 'style': {
            attr_marker = AttributeMarker.Styles;
            break;
          }

          case 'class': {
            attr_marker = AttributeMarker.Classes;
            break;
          }

          default: {
            break;
          }
        }

        tempConstsStmts.push(
            ts.factory.createArrayLiteralExpression(
                [
                  !attr_marker ? ts.factory.createStringLiteral(attr) : ts.factory.createNumericLiteral(attr_marker),
                  ts.factory.createStringLiteral(attributes[attr])
                ]
            )
        )
        attrIndex = this.consts.length;
      }
    }

    // here, push consts
    this.consts.push(
        ts.factory.createArrayLiteralExpression(
            tempConstsStmts
        )
    )

    this.stmts.push(generateElementStartNode(index, tag, /* Object.keys(attributes).length == 0 ? null : index + 1,*/ attrIndex), ...tempStmts);

    // Process children
    // let childIndex = index + 1;
    // element.childNodes.forEach((childNode, idx) => {
    //
    //   if (tag === "style") {
    //     const cssParser = new CSSParser();
    //     (childNode as Text).data = cssParser.parsePostCSS((childNode as Text).data.trim())
    //   }
    //
    //   const { creation: childCreation, update: childUpdate } = this.processNode(
    //     childNode,
    //     childIndex + idx
    //   );
    //   creation += childCreation;
    //   update += childUpdate;
    //   childIndex += idx + 1;
    // });

    const viewGenerator = new ViewGenerator();
    viewGenerator.slot = this.slot;
    viewGenerator.implicitVariables.push(...this.implicitVariables);
    viewGenerator.consts = [...this.consts]
    this.consts = []
    viewGenerator.processChildNodes(element);
    this.consts = [...viewGenerator.consts]
    this.slot = viewGenerator.slot

    this.stmts.push(...viewGenerator.stmts);
    this.updateStmts.push(...viewGenerator.updateStmts);
    this.templateStmts.push(...viewGenerator.templateStmts);

    this.stmts.push(generateElementEndNode());

    return {creation: "", update: "", attrArray: []};
  }

  private processText(
    textNode: Text,
    index: number
  ): { creation: string; update: string } {

    const parentElement = textNode.parent as Element;
    let isTextStyle = false;

    if (parentElement instanceof Element) {
      if (parentElement.type === ElementType.Style) {
        isTextStyle = true;
        const cssParser = new CSSParser();
        (textNode as Text).data = cssParser.parsePostCSS((textNode as Text).data.trim())
      }
    }

    const text = textNode.data.trim();
    if (text) {
      const matches = text.match(/{{(.*?)}}/);
      if (matches) {
        const bindingExpression = matches[1].trim();

        this.stmts.push(generateTextNode(index));

        this.updateStmts.push(generateAdvanceNode(index.toString()));
        this.updateStmts.push(generateTextInterpolateNode(this.parseInterpolations(text), this.implicitVariables))

        return {
          creation: ``,
          update: ``,
        };
      } else {
        if (isTextStyle) {
          this.stmts.push(generateTextStyleNode(index, text));
        } else {
          this.stmts.push(generateTextNode(index, text));
        }
        return {
          creation: ``,
          update: "",
        };
      }
    }
    return { creation: "", update: "" };
  }

  parseInterpolations(input: string): Array<InterpolationType> {
    const regex = /{{(.*?)}}|([^{{}}]+)/g;
    const result: Array<{ type: 'text' | 'expression', content: string }> = [];
    let match;

    while ((match = regex.exec(input)) !== null) {
      if (match[1] !== undefined) {
        // This is an expression match
        result.push({ type: 'expression', content: match[1] });
      } else if (match[2] !== undefined) {
        // This is a text match
        result.push({ type: 'text', content: match[2] });
      }
    }

    return result;
  }

  private wrapCode(creationCode: string, updateCode: string): string {
    return `
    if (rf & ${RenderFlags.CREATE}) {
      ${creationCode}
    }
    
    if (rf & ${RenderFlags.UPDATE}) {
      ${updateCode}
    }
    `;
  }

  private processTemplateElement(tag: string, node: Element, index: number) {

    if (tag === "ng-if") {
      return this.processNgIf(node, index);
    }

    if (tag === "ng-for") {
      return this.processNgFor(node, index);
    }

    if (tag === "ng-switch") {
      return this.processNgSwitch(node, index);
    }

    if (tag === "ng-while") {
      return this.processNgWhile(node, index);
    }

    // ng-cloak

    if (tag === "ng-template") {
      return this.processNgTemplate(node, index);
    }

    return {creation: "", update: ""};

  }

  processNgIf(node: Element, index: number) {
    const containerIndex = index;
    const functionName = "Template_" + index + "_tag_Conditional";
    const conditions = []

    const childNodes = [];
    const elseIfNodes = [];
    let elseNode;

    // if tag == ng-if
    // create a function outside of this class
    let cond_expr = ""
    for(const attr in node.attribs) {
      if (attr == "condition") {
        cond_expr = node.attribs[attr];
        conditions.push({
          slotIndex: index,
          type: "if",
          attributeValue: cond_expr
        })
        break;
      }
    }

    node.childNodes.forEach((childNode, _) => {
      if (childNode instanceof Element) {
        if ((childNode as Element).tagName === "ng-elseif") {

          elseIfNodes.push(childNode);
        } else if (childNode.tagName === "ng-else") {
          elseNode = childNode;
        } else {
          childNodes.push(childNode);
        }
      } else  {
        childNodes.push(childNode);
      }
    })

    const templateNode = generateTemplateNode(index, functionName, "ng-if");

    const viewGenerator = new ViewGenerator();
    viewGenerator.consts = [...viewGenerator.consts]
    this.consts = []
    viewGenerator.processChildren(childNodes);
    this.consts = [...viewGenerator.consts];

    this.stmts.push(templateNode)

    // process else-ifs
    elseIfNodes.forEach(elseIfNode => {

      const slotIndex = this.slot++
      const elseIfName = "Template_" + slotIndex + "_tag_Conditional";
      this.stmts.push(generateTemplateNode(slotIndex, elseIfName, "ng-elseif"))

      const viewGenerator = new ViewGenerator();
      viewGenerator.consts = [...viewGenerator.consts]
      this.consts = []
      viewGenerator.processChildNodes(elseIfNode);
      this.consts = [...viewGenerator.consts];

      for(const attr in elseIfNode.attribs) {
        if (attr == "condition") {
          conditions.push({
            slotIndex,
            type: "elseif",
            attributeValue: elseIfNode.attribs[attr],
          })
          break;
        }
      }

      this.templateStmts.push({
        functionName: elseIfName,
        updateStmts: [...viewGenerator.updateStmts],
        stmts: [...viewGenerator.stmts],
        templateStmts: viewGenerator.templateStmts
      });

    })

    // process else node
    if (elseNode) {
      const slotIndex = this.slot++
      const elseFunctionName = "Template_" + slotIndex + "_tag_Conditional"
      this.stmts.push(generateTemplateNode(slotIndex, elseFunctionName, "ng-else"))
      conditions.push({
        slotIndex,
        type: "else",
        attributeValue: undefined,
      })

      const viewGenerator = new ViewGenerator();
      viewGenerator.consts = [...viewGenerator.consts]
      this.consts = []
      viewGenerator.processChildNodes(elseNode);
      this.consts = [...viewGenerator.consts];
      this.templateStmts.push({
        functionName: elseFunctionName,
        updateStmts: [...viewGenerator.updateStmts],
        stmts: [...viewGenerator.stmts],
        templateStmts: viewGenerator.templateStmts
      });

    }

    this.templateStmts.push({
      functionName: functionName,
      updateStmts: [...viewGenerator.updateStmts],
      stmts: [...viewGenerator.stmts],
      templateStmts: [...viewGenerator.templateStmts]
    });

    this.updateStmts.push(generateAdvanceNode(index.toString()))

    const updateTemplateNode = generateConditionalNode(conditions, containerIndex)

    this.updateStmts.push(updateTemplateNode)

    return {creation: "", update: ""};

  }

  processChildNodes(node: Element) {

    this.setIndex(0)

    for (; this.index < node.childNodes.length; this.index++) {
      const childNode = node.childNodes[this.index];
      const index = this.index;

      if (childNode.type === ElementType.Comment) continue

      this.processNode(childNode, index)

    }

  }

  processChildren(nodes: Node[]) {

    this.setIndex()

    for (; this.index < nodes.length; this.index++) {
      const childNode = nodes[this.index];
      const index = this.index;

      if (childNode.type === ElementType.Comment) continue

      this.processNode(childNode, index)

    }

  }

  private processNgFor(node: Element, slotIndex: number) {
    // item="user" of="users" trackBy="id"
    // decls="arr of prim; track $index; let last = $last"

    let emptyTemplateFnName;
    let iterableIdentifier: string
    let iterable: string;
    let trackBy: string;

    const keys = Object.keys(node.attribs);

    if (keys.length <= 0) {
      throw Error("'ng-for/@for' must contain 'of' and 'item'");
    }

    if (keys.includes("decls")) {

      const parts = node.attribs["decls"].split(";");
      parts.forEach((part, index) => {

        if (part?.split(' ')?.[1] === 'of' && part?.split(' ')?.length === 3) {

          const iterableParts = part.split(' ');
          iterableIdentifier = iterableParts[0];
          iterable = iterableParts[2];

        } else if (part?.trim()?.split(' ')?.[0] === "track") {
          trackBy = part?.trim()?.split(' ')?.[1]
        } else if (part?.trim()?.split(' ')?.[0] === "let") {
        }

      })

    } else {

      for (const attrib in node.attribs) {

        const attribValue = node.attribs[attrib];

        if (attrib === "of") iterable = attribValue;
        if (attrib === "item") iterableIdentifier = attribValue;
        if (attrib === "trackBy") trackBy = attribValue;

      }

    }

    const ngForSibling = getNgForEmptySibling(node, this.index)

    if (ngForSibling) {
      if (ngForSibling.element.type === ElementType.Tag && ngForSibling.element.tagName === 'ng-for-empty') {

        const ngForEmptyIndex = slotIndex;
        emptyTemplateFnName = "Template_For_Empty_" + ngForEmptyIndex + "_For"

        const viewGenerator = this.processNgEmpty(ngForSibling.element);

        this.templateStmts.push({
          functionName: emptyTemplateFnName,
          updateStmts: [...viewGenerator.updateStmts],
          stmts: [...viewGenerator.stmts],
          templateStmts: [...viewGenerator.templateStmts]
        });

        this.slot++;
        this.skipNode = ngForSibling.indx;
        this.setIndex(ngForSibling.indx);

      }
    }

    const functionName = "Template_For_" + slotIndex + "_Tag";
    const viewGenerator = new ViewGenerator();
    viewGenerator.setImplicitVariables(iterableIdentifier, this.implicitVariables);
    viewGenerator.consts = [...this.consts]
    this.consts = []
    viewGenerator.processChildren(node.children);
    this.consts = [...viewGenerator.consts]

    const repeaterCreateNode = generateRepeaterCreateNode(node, slotIndex, functionName, emptyTemplateFnName);

    this.updateStmts.push(generateAdvanceNode(slotIndex.toString()))

    const exprParser = new ExpressionParser();
    const exprParserSourceFile = exprParser.parse(iterable, this.implicitVariables);

    const updateRepeaterNode = generateUpdateRepeaterNode(exprParserSourceFile)

    this.stmts.push(repeaterCreateNode);

    this.updateStmts.push(updateRepeaterNode);

    this.templateStmts.push({
      functionName: functionName,
      updateStmts: [...viewGenerator.updateStmts],
      stmts: [...viewGenerator.stmts],
      templateStmts: [...viewGenerator.templateStmts]
    });

    return {creation: "", update: ""};

  }

  private processNgEmpty(ngForSibling: Element) {

    const viewGenerator = new ViewGenerator();
    viewGenerator.consts = [...this.consts]
    this.consts = []
    viewGenerator.processChildren(ngForSibling.children);
    this.consts = [...viewGenerator.consts]

    return viewGenerator

  }

  private processNgSwitch(node: Element, index: number) {
    const conditions = []
    const condition = node.attribs["condition"];

    if (!condition) {
      throw Error("ng-switch must have a condition.")
    }

    node.childNodes.forEach(childNode => {

      if (childNode.type == ElementType.Tag) {

        const slotIndex = this.slot++
        const tagName = childNode.tagName;

        switch (tagName) {
          case 'ng-case': {

            const functionName = "NgSwitch_Case_" + slotIndex + "_Template"

            const templateNode = generateTemplateNode(slotIndex, functionName, tagName);

            this.stmts.push(templateNode)

            conditions.push({
              slotIndex,
              type: conditions.length == 0 ? "if" : "elseif",
              attributeValue: condition + " === " + childNode.attribs["value"],
            })

            const viewGenerator = new ViewGenerator();
            viewGenerator.consts = [...viewGenerator.consts]
            this.consts = []
            viewGenerator.processChildNodes(childNode);
            this.consts = [...viewGenerator.consts]

            this.templateStmts.push({
              functionName: functionName,
              updateStmts: [...viewGenerator.updateStmts],
              stmts: [...viewGenerator.stmts],
              templateStmts: [...viewGenerator.templateStmts]
            });

            break;

          }

          case 'ng-default': {

            const functionName = "NgSwitch_Default_Case_" + slotIndex + "_Template"

            const templateNode = generateTemplateNode(slotIndex, functionName, tagName);

            this.stmts.push(templateNode)

            conditions.push({
              slotIndex,
              type: "else",
              attributeValue: undefined,
            })

            const viewGenerator = new ViewGenerator();
            viewGenerator.consts = [...viewGenerator.consts]
            this.consts = []
            viewGenerator.processChildNodes(childNode);
            this.consts = [...viewGenerator.consts]

            this.templateStmts.push({
              functionName: functionName,
              updateStmts: [...viewGenerator.updateStmts],
              stmts: [...viewGenerator.stmts],
              templateStmts: [...viewGenerator.templateStmts]
            });

            break;

          }

          default: {
            throw Error("ng-switch must have a default tag.")
          }
        }
      }
    })

    this.updateStmts.push(generateAdvanceNode(index.toString()))

    const containerIndex = conditions.find(condition => condition.type == "if")?.slotIndex;

    const updateTemplateNode = generateConditionalNode(conditions, containerIndex)

    this.updateStmts.push(updateTemplateNode)

    return {creation: "", update: ""};
  }

  private processNgWhile(node: Element, index: number) {
    return {creation: "", update: ""};
  }

  setImplicitVariables(variableName: string, parentImplicitVariables: string[]) {
    this.implicitVariables.push(parentImplicitVariables);
    this.implicitVariables.push(variableName);
  }

  private setIndex(index: number = 0) {
    this.index = index;
  }

  private processPipe(node: Element, index: number) {

    this.stmts.push(generateTextNode(index, ""))
    let slotIndex = this.slot + 1

    let expr = null
    let pipeIndices = []

    for (const attrib in node.attribs) {

      const attribValue = node.attribs[attrib];

      if (attrib === "expr") {
        expr = attribValue;
      } else {

        slotIndex = ++this.slot
        pipeIndices.push(slotIndex);
        this.stmts.push(generatePipeNode(slotIndex, attribValue));

      }

    }

    // advance node
    const exprParser = ExpressionParser.instance;
    expr = exprParser.parseToExpression(expr, [])

    pipeIndices.sort().forEach(pipeIndex => {

      expr = factory.createCallExpression(
          factory.createPropertyAccessExpression(
          factory.createIdentifier(i0),
          ɵɵpipeBind
      ), undefined,
          [
              ts.factory.createNumericLiteral(pipeIndex),
              ts.factory.createNull(),
              expr
          ]
      )

    })

    this.updateStmts.push(generateAdvanceNode(index.toString()))
    this.updateStmts.push(generateTextInterpolateNode(
      [
        {
          type: "statement",
          statement: expr
        }
      ],
        null
    ))

    return {creation: "", update: ""};
  }

  private processNgTemplate(node: Element, index: number) {
    return undefined;
  }
}

function generateElementStartNode(
  index: number,
  element: string,
  attrsIndex?: number
) {
  const params = [
    ts.factory.createNumericLiteral(index),
    ts.factory.createStringLiteral(element),
  ];

  if (attrsIndex !== undefined && attrsIndex >= 0) {
    params.push(ts.factory.createNumericLiteral(attrsIndex));
  }

  return ts.factory.createExpressionStatement(
    ts.factory.createCallExpression(
      ts.factory.createPropertyAccessExpression(
        ts.factory.createIdentifier(i0),
        ts.factory.createIdentifier(ɵɵelementStart)
      ),
      undefined,
      params
    )
  );
}

function generateElementEndNode() {
  return ts.factory.createExpressionStatement(
    ts.factory.createCallExpression(
      ts.factory.createPropertyAccessExpression(
        ts.factory.createIdentifier(i0),
        ts.factory.createIdentifier(ɵɵelementEnd)
      ),
      undefined,
      []
    )
  );
}

function generateTextNode(index: number, text?: string) {
  const params: ts.Expression[] = [
    ts.factory.createNumericLiteral(index),
  ];

  if (text) {
    params.push(ts.factory.createStringLiteral(text));
  }

  return ts.factory.createExpressionStatement(
    ts.factory.createCallExpression(
      ts.factory.createPropertyAccessExpression(
        ts.factory.createIdentifier(i0),
        ts.factory.createIdentifier(ɵɵtext)
      ),
      undefined,
      params
    )
  );
}

function generatePipeNode(index: number, text: string) {
  const params: ts.Expression[] = [
    ts.factory.createNumericLiteral(index),
    ts.factory.createStringLiteral(text),
  ];

  return ts.factory.createExpressionStatement(
      ts.factory.createCallExpression(
          ts.factory.createPropertyAccessExpression(
              ts.factory.createIdentifier(i0),
              ts.factory.createIdentifier(ɵɵpipe)
          ),
          undefined,
          params
      )
  );
}

function generateTextStyleNode(index: number, text?: string) {

  const params: ts.Expression[] = [
    ts.factory.createNumericLiteral(index),
  ];

  if (text) {
    params.push(ts.factory.createStringLiteral(text));
  }

  return ts.factory.createExpressionStatement(
      ts.factory.createCallExpression(
          ts.factory.createPropertyAccessExpression(
              ts.factory.createIdentifier(i0),
              ts.factory.createIdentifier(ɵɵtextStyle)
          ),
          undefined,
          params
      )
  );
}

function generateListenerNode(eventName: string, tag: string, index: number, handler: string) {
  return ts.factory.createExpressionStatement(
    ts.factory.createCallExpression(
      ts.factory.createPropertyAccessExpression(
        ts.factory.createIdentifier(i0),
        ts.factory.createIdentifier(ɵɵlistener)
      ),
      undefined,
      [
        ts.factory.createStringLiteral(eventName),
        ts.factory.createArrowFunction(
          undefined,
          undefined,
          [ts.factory.createParameterDeclaration(
              undefined, undefined, ts.factory.createIdentifier($event), undefined, undefined, undefined
          )],
          undefined,
          ts.factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
          ts.factory.createBlock(
              [
                ts.factory.createReturnStatement(
                        ts.factory.createPropertyAccessExpression(
                            ts.factory.createIdentifier(ctx),
                            ts.factory.createIdentifier(handler)
                        )
                )
              ]
          )
        )
      ]
    )
  )
}

function generatePropertyNode(propertyName: string, value: string, implicitVariables: string[]) {

  const exprParser = new ExpressionParser();
  const transformedNode = exprParser.parse(value, implicitVariables);

  return ts.factory.createExpressionStatement(
        ts.factory.createCallExpression(
        ts.factory.createPropertyAccessExpression(
            ts.factory.createIdentifier(i0),
            ts.factory.createIdentifier(ɵɵproperty)
        ),
        undefined,
        [
            ts.factory.createStringLiteral(propertyName),
            // @ts-ignore
            transformedNode.statements[0].expression
            // ts.factory.createStringLiteral(value)
        ]
        )
    )
}

function generateAdvanceNode(index: string) {
  return factory.createExpressionStatement(factory.createCallExpression(
      factory.createPropertyAccessExpression(
          factory.createIdentifier(i0),
          ɵɵadvance
      ), undefined,
      [
          factory.createIdentifier(index)
      ]
  ))
}

function generateTextInterpolateNode(bindingExpressions: InterpolationType[], implicitVariables: string[]) {

  const exprParser = new ExpressionParser();

  const bindingExpressionStmts = bindingExpressions.map((binding) => {
    if (binding.type === 'text') {
      return factory.createStringLiteral(binding.content)
    } else if (binding.type === 'expression') {
      const transformedNode = exprParser.parse(binding.content, implicitVariables);
      // @ts-ignore
      return transformedNode.statements[0].expression;
    } else if (binding.type === 'statement') {
      return binding.statement
    }
  }).filter(Boolean)

    // @ts-ignore
  const expressionStatement = factory.createExpressionStatement(factory.createCallExpression(
        factory.createPropertyAccessExpression(
            factory.createIdentifier(i0),
            ɵɵtextInterpolate
        ), undefined,
        // @ts-ignore
        [
            // @ts-ignore
          ...bindingExpressionStmts
        ]
    ))
    return expressionStatement
}

function generateTemplateNode(index: number, functionName: string, templateName: string) {
  return ts.factory.createExpressionStatement(
      ts.factory.createCallExpression(
          ts.factory.createPropertyAccessExpression(
              ts.factory.createIdentifier(i0),
              ts.factory.createIdentifier("ɵɵtemplate")
          ),
          undefined,
          [
            ts.factory.createNumericLiteral(index),
            ts.factory.createIdentifier(functionName),
            ts.factory.createStringLiteral(templateName)
          ]
      )
  )
}

function generateConditionalNode(conditionals: any[], containerIndex: number) {

  const exprParser = new ExpressionParser();

  let expr: ts.Expression

  if (conditionals.length == 1) {

    const condition = conditionals[0];

    const conditionExpr =
        // @ts-ignore
        exprParser.parse(condition.attributeValue).statements[0].expression;

    expr = ts.factory.createConditionalExpression(
        conditionExpr,
        ts.factory.createToken(ts.SyntaxKind.QuestionToken),
        // @ts-ignore
        exprParser.parse(condition.slotIndex.toString()).statements[0].expression,
        ts.factory.createToken(ts.SyntaxKind.ColonToken),
        ts.factory.createNumericLiteral("-1")
    );
  } else {

    for (let i = conditionals.length - 1; i >= 0; i--) {

      const { type, slotIndex, attributeValue } = conditionals[i];
      const conditionType = type

      if (conditionType === 'else') {
        // @ts-ignore
        expr = exprParser.parse(slotIndex.toString()).statements[0].expression;
        continue
      }

      if (conditionType === 'elseif') {

        const conditionExpr =
            // @ts-ignore
            exprParser.parse(attributeValue).statements[0].expression;

        expr = ts.factory.createConditionalExpression(
            conditionExpr,
            ts.factory.createToken(ts.SyntaxKind.QuestionToken),
            // @ts-ignore
            exprParser.parse(slotIndex.toString()).statements[0].expression,
            ts.factory.createToken(ts.SyntaxKind.ColonToken),
            expr
        );
        continue
      }

      if (conditionType === 'if') {

        const conditionExpr =
            // @ts-ignore
            exprParser.parse(attributeValue).statements[0].expression;

        expr = ts.factory.createConditionalExpression(
            conditionExpr,
            ts.factory.createToken(ts.SyntaxKind.QuestionToken),
            // @ts-ignore
            exprParser.parse(slotIndex.toString()).statements[0].expression, // must be ts.Expression
            ts.factory.createToken(ts.SyntaxKind.ColonToken),
            expr
        );

      }

    }

  }

  const containerEndIndex = containerIndex + conditionals.length - 1

  return ts.factory.createExpressionStatement(
      ts.factory.createCallExpression(
          ts.factory.createPropertyAccessExpression(
              ts.factory.createIdentifier(i0),
              ts.factory.createIdentifier(ɵɵconditional)
          ),
          undefined,
          [
            ts.factory.createNumericLiteral(containerIndex),
            ts.factory.createNumericLiteral(containerEndIndex),
              expr
          ]
      )
  );
}

function generateRepeaterCreateNode(node: Element, slotIndex: number, functionName: string, emptyTemplateFnName: string) {
  return ts.factory.createExpressionStatement(
      ts.factory.createCallExpression(
          ts.factory.createPropertyAccessExpression(
              ts.factory.createIdentifier(i0),
              ts.factory.createIdentifier(ɵɵrepeaterCreate)
          ), undefined,
          [
            ts.factory.createNumericLiteral(slotIndex),
            ts.factory.createIdentifier(functionName),
            ts.factory.createNumericLiteral(0),
            ts.factory.createNumericLiteral(0),
            ts.factory.createStringLiteral(node.tagName),
            ts.factory.createNull(),
            ts.factory.createNull(), // trackByFn
            ts.factory.createNull(),
            emptyTemplateFnName ? ts.factory.createIdentifier(emptyTemplateFnName) : ts.factory.createNull(),
            ts.factory.createNull(),
            ts.factory.createNull(),
            emptyTemplateFnName ? ts.factory.createStringLiteral("ng-for-empty") : ts.factory.createNull(),
            ts.factory.createNull(),
          ]
      )
  )
}

function generateUpdateRepeaterNode(exprParserSourceFile: SourceFile) {
  return ts.factory.createExpressionStatement(
      ts.factory.createCallExpression(
          ts.factory.createPropertyAccessExpression(
              ts.factory.createIdentifier(i0),
              ts.factory.createIdentifier(ɵɵrepeater)
          ),
          undefined,
          [
            // @ts-ignore
            exprParserSourceFile.statements[0].expression
          ]
      )
  )
}

function findNgForEmpty(node: Element) {
  let current = node.next;

  while (current) {

    // 1️⃣ Skip empty text nodes
    if (current.type === ElementType.Text) {
      const text = current.data.trim();

      if (text === "") {
        current = current.next;
        continue;
      }

      // Non-empty text → error
      throw new Error(
          "Non-empty text is not allowed between <ng-for> and <ng-for-empty>."
      );
    }

    // 2️⃣ If element
    if (current.type === ElementType.Tag) {

      if (current.tagName === "ng-for-empty") {
        return current; // ✅ valid
      }

      // Some other element → error
      throw new Error(
          `<ng-for-empty> must appear immediately after <ng-for>. Found <${current.tagName}> instead.`
      );
    }

    // 3️⃣ Any other node type → error
    throw new Error(
        "Invalid node between <ng-for> and <ng-for-empty>."
    );
  }

  return null; // no ng-for-empty (optional case)
}

function getNgForEmptySibling(node: Node, currentIndex: number): { element: Element; indx: number } | null {
  let current = node.next;
  let indx = currentIndex + 1

  while (current) {

    // Skip whitespace-only text nodes
    if (current.type === ElementType.Text) {
      const textNode = current;

      if (textNode.data.trim() === "") {
        current = current.next;
        indx++;
        continue;
      }

    }

    // If tag node
    if (current.type === ElementType.Tag) {
      const element = current as Element;

      if (element.name === "ng-for-empty") {
        indx++;
        return { element, indx };
      } else {
        return null
      }

    }

    // Ignore comments
    if (current.type === ElementType.Comment) {
      current = current.next;
      indx++;
      continue
    }

    if (!current) {
      return null;
    }

  }

  return null;
}

function buildIfElseChain(conditionals: any[]): ts.Statement {
  const elseBlock = conditionals.find(c => c.type === 'else');

  if (!elseBlock) {
    throw new Error("else is required");
  }

  let stmt: ts.Statement = ts.factory.createReturnStatement(
      ts.factory.createNumericLiteral(elseBlock.slotIndex)
  );

  // walk backwards, skipping else
  for (let i = conditionals.length - 1; i >= 0; i--) {
    const c = conditionals[i];

    if (c.type === 'if' || c.type === 'elseif') {
      stmt = ts.factory.createIfStatement(
          ts.factory.createIdentifier(c.attributeValue),
          ts.factory.createReturnStatement(
              ts.factory.createNumericLiteral(c.slotIndex)
          ),
          stmt // 👈 else / else-if
      );
    }
  }

  return stmt;
}

function buildReturnTernary(conditionals: any[]): ts.Statement {
  const elseBlock = conditionals.find(c => c.type === 'else');

  let expr: ts.Expression = ts.factory.createNumericLiteral(
      elseBlock.slotIndex
  );

  for (let i = conditionals.length - 1; i >= 0; i--) {
    const c = conditionals[i];

    if (c.type === 'if' || c.type === 'elseif') {
      expr = ts.factory.createConditionalExpression(
          ts.factory.createIdentifier(c.attributeValue),
          ts.factory.createToken(ts.SyntaxKind.QuestionToken),
          ts.factory.createNumericLiteral(c.slotIndex),
          ts.factory.createToken(ts.SyntaxKind.ColonToken),
          expr
      );
    }
  }

  return ts.factory.createReturnStatement(expr);
}
