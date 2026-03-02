import * as ts from "typescript";
import * as fs from "fs"
import { readFileSync } from 'node:fs';
import { Parser } from "../template/parser";
import {CSSParser} from "../css_parser/css_parser";
import {i0, rf, ɵcmp, ɵfac, ɵɵdefineComponent, ɵɵdirectiveInject} from "../constants/constants";
import * as path from "node:path";
import {Template} from "../template/view_generator";
import {factory} from "typescript";
import {getTokenExpression} from "../visitor/directive_visitor";
import {DirectivesToInject} from "../visitor/visitor";
import {extractInputsOutputs} from "./input_output_transformer";

export type ComponentMetadata = {
  selector: ts.PropertyAssignment;
  name: ts.PropertyAssignment;
  template: ts.PropertyAssignment;
  templateUrl: ts.PropertyAssignment;
  styleUrl: ts.PropertyAssignment;
  styleUrls: ts.ObjectLiteralElementLike;
  styles: ts.PropertyAssignment;
  providers: ts.ObjectLiteralElementLike;
  animations: ts.ObjectLiteralElementLike;
  encapsulation: ts.ObjectLiteralElementLike;
  changeDetection: ts.ObjectLiteralElementLike;
  interpolation: ts.ObjectLiteralElementLike;
  preserveWhitespaces: ts.ObjectLiteralElementLike;
  dependencies: ts.ObjectLiteralElementLike;
  host: ts.PropertyAssignment;
};

export function classHasDecorator(node: ts.ClassDeclaration, decoratorName: string) {
  const decorators = ts.getDecorators(node);
  return (
      decorators && ts.canHaveDecorators(node) &&
      decorators.some(
          (decorator) =>
              ts.isCallExpression(decorator.expression) &&
              ts.isIdentifier(decorator.expression.expression) &&
              decorator.expression.expression.text === decoratorName
      )
  );
}

export function hasComponentDecorator(node: ts.ClassDeclaration) {
  const decorators = ts.getDecorators(node);
  return (
    decorators && ts.canHaveDecorators(node) &&
    decorators.some(
      (decorator) =>
        ts.isCallExpression(decorator.expression) &&
        ts.isIdentifier(decorator.expression.expression) &&
        decorator.expression.expression.text === "Component"
    )
  );
}

export function getComponentDecorator(node: ts.ClassDeclaration): ts.Decorator {
  const decorators = ts.getDecorators(node);
  return decorators.find(
    (decorator) => {
      return ts.isCallExpression(decorator.expression) &&
      ts.isIdentifier(decorator.expression.expression) &&
      (decorator.expression.expression.text === "Component" ||
          decorator.expression.expression.text === "Directive" ||
          decorator.expression.expression.text === "Pipe" ||
          decorator.expression.expression.text === "Injectable"
      )
    }
  );
}

export function extractComponentMetadata(
  decorator: ts.Decorator
): ComponentMetadata {
  const metadata = (decorator.expression as ts.CallExpression)
    .arguments[0] as ts.ObjectLiteralExpression;

  const selector = getMetadataProperty(
    metadata.properties,
    "selector"
  ) as ts.PropertyAssignment;
  const template = getMetadataProperty(
    metadata.properties,
    "template"
  ) as ts.PropertyAssignment;

  // templateUrl
  const templateUrl = getMetadataProperty(metadata.properties, "templateUrl") as ts.PropertyAssignment;
  const styleUrls = getMetadataProperty(metadata.properties, "styleUrls");
  const styleUrl = getMetadataProperty(metadata.properties, "styleUrl") as ts.PropertyAssignment;
  const providers = getMetadataProperty(metadata.properties, "providers");
  const animations = getMetadataProperty(metadata.properties, "animations");
  const encapsulation = getMetadataProperty(
    metadata.properties,
    "encapsulation"
  );
  const changeDetection = getMetadataProperty(
    metadata.properties,
    "changeDetection"
  );
  const interpolation = getMetadataProperty(
    metadata.properties,
    "interpolation"
  );
  const preserveWhitespaces = getMetadataProperty(
    metadata.properties,
    "preserveWhitespaces"
  );

  const dependencies = getMetadataProperty(metadata.properties, "imports");

  const styles = getMetadataProperty(metadata.properties, "styles") as ts.PropertyAssignment;

  const host = getMetadataProperty(metadata.properties, "host") as ts.PropertyAssignment;

  const name = getMetadataProperty(metadata.properties, "name") as ts.PropertyAssignment;

  return {
    selector,
    name,
    template,
    templateUrl,
    styleUrls,
    styleUrl,
    styles,
    providers,
    animations,
    encapsulation,
    changeDetection,
    interpolation,
    preserveWhitespaces,
    dependencies,
    host,
  };
}

function getMetadataProperty(
  properties: ts.NodeArray<ts.ObjectLiteralElementLike>,
  property: string
) {
  return properties.find(
    (prop: ts.PropertyAssignment) => prop.name.getText() === property
  );
}

export function createFactoryStatic(componentName: string, node: ts.Node, directivesToInject: DirectivesToInject[]) {
  const f = ts.factory;

  const factoryArgs = directivesToInject.map(directiveToInject => {

    const param = directiveToInject.parameter;

    if (!param.type || !ts.isTypeReferenceNode(param.type)) {
      throw new Error("DI param must have type");
    }

    const tokenExpr = getTokenExpression(param.type, directiveToInject.fromMiniNgCore);

    return ts.factory.createCallExpression(
        ts.factory.createPropertyAccessExpression(
            ts.factory.createIdentifier(i0),
            ɵɵdirectiveInject
        ),
        undefined,
        [tokenExpr]
    );
  });

  return f.createPropertyDeclaration(
    [f.createModifier(ts.SyntaxKind.StaticKeyword)],
    ɵfac,
    undefined,
    undefined,
    f.createFunctionExpression(
      undefined,
      undefined,
      `${componentName}_Factory`,
      undefined,
      [
        f.createParameterDeclaration(
          undefined,
          undefined,
          "t",
          undefined,
          undefined,
          undefined,
        ),
      ],
      undefined,
      f.createBlock(
        [
          f.createReturnStatement(
            f.createNewExpression(
              f.createParenthesizedExpression(
                  f.createLogicalOr(
                    f.createIdentifier("t"),
                    f.createIdentifier(componentName)
                  )
                ),
              undefined,
              factoryArgs,
            ),
          ),
        ],
        true,
      ),
    ),
  );
}

export function createDefineComponentStatic(
  componentName: string,
  metadata: ComponentMetadata,
  node: ts.Node,
  hoisted: ts.Statement[]
) {
  const f = ts.factory;

  return f.createPropertyDeclaration(
    [f.createModifier(ts.SyntaxKind.StaticKeyword)],
    ɵcmp,
    undefined,
    undefined,
    f.createCallExpression(
      f.createPropertyAccessExpression(
        f.createIdentifier(i0),
        ɵɵdefineComponent,
      ),
      undefined,
      [
        f.createObjectLiteralExpression(
          createCmpDefinitionPropertiesNode(componentName, metadata, node, hoisted),
          true,
        ),
      ],
    ),
  );
}

export function createCmpDefinitionPropertiesNode(
  componentName: string,
  metadata: ComponentMetadata,
  node: ts.Node,
  hoisted: ts.Statement[]
): ts.ObjectLiteralElementLike[] {
  const sourceFile = node.getSourceFile();
  const tsFilePath = sourceFile.fileName;

  const properties = [];

  // type
  properties.push(
    ts.factory.createPropertyAssignment(
      ts.factory.createIdentifier("type"),
      ts.factory.createIdentifier(componentName)
    )
  );

  // selector
  const selector = (metadata.selector.initializer as ts.StringLiteral).text;
  if (selector) {
    let selectorArray = []

    if (selector.startsWith("[")) {
      selectorArray = parseDirectiveSelector(selector)
    } else {
      selectorArray.push(selector)
    }

    properties.push(
        ts.factory.createPropertyAssignment(
            ts.factory.createIdentifier("selectors"),
            ts.factory.createArrayLiteralExpression(
                [
                  ts.factory.createArrayLiteralExpression(
                      selectorArray.map(currentSelector => ts.factory.createStringLiteral(currentSelector)),
                      false
                  ),
                ],
                false
            )
        )
    );
  }

  // TODO: there is no need for standalone since that's the general purpose of mini-ng
  // standalone
  // if (metadata.standalone) {
  //   properties.push(
  //     ts.factory.createPropertyAssignment("standalone", ts.factory.createTrue())
  //   );
  // } else {
  //   properties.push(
  //     ts.factory.createPropertyAssignment(
  //       "standalone",
  //       ts.factory.createFalse()
  //     )
  //   );
  // }

  if (metadata.dependencies) {
    
    const deps = ((metadata.dependencies as ts.PropertyAssignment).initializer as ts.ArrayLiteralExpression).elements.map(el => {
      return el;
    });

    properties.push(ts.factory.createPropertyAssignment(
      ts.factory.createIdentifier("dependencies"),
      ts.factory.createArrayLiteralExpression(
        deps
      )
    ));
  }

  // templateUrl
  if (metadata.templateUrl) {

    const templateUrlPath = (metadata.templateUrl.initializer as ts.StringLiteral).text;

    // read templateUrlPath
    const templateString = readTemplate(tsFilePath, templateUrlPath);

    const { templateNode, constsNode, templateStmts} = generateTemplateInstructions(componentName, templateString);
    properties.push(templateNode);
    properties.push(constsNode);

    generateTemplateStmts(templateStmts, sourceFile, hoisted)


  }

  // template
  const template = metadata.template;

  if (template) {

    const templateString = (template.initializer as ts.StringLiteral).text;

    const { templateNode, constsNode, templateStmts} = generateTemplateInstructions(componentName, templateString);
    properties.push(templateNode);
    properties.push(constsNode);

    generateTemplateStmts(templateStmts, sourceFile, hoisted)

  }

  // styles
  const styles = metadata.styles;

  if (styles) {

    const cssText = (styles.initializer as ts.StringLiteral).text;

    const cssParser = new CSSParser();
    const result = cssParser.parsePostCSS(cssText);

    properties.push(ts.factory.createPropertyAssignment(
        ts.factory.createIdentifier("styles"),
        ts.factory.createArrayLiteralExpression(
            [ts.factory.createStringLiteral(result)]
        )
    ))
  }

  if (metadata.styleUrl) {

    const cssParser = new CSSParser();

    const styleUrlPath = (metadata.styleUrl.initializer as ts.StringLiteral).text;

    const styleString = readTemplate(tsFilePath, styleUrlPath);
    const result = cssParser.parsePostCSS(styleString);

    properties.push(ts.factory.createPropertyAssignment(
        ts.factory.createIdentifier("styles"),
        ts.factory.createArrayLiteralExpression(
            [ts.factory.createStringLiteral(result)]
        )
    ));

  }

  if (metadata.styleUrls) {

    const cssParser = new CSSParser();

    const styleUrls = ((metadata.styleUrls as ts.PropertyAssignment).initializer as ts.ArrayLiteralExpression).elements.map(style => {

      const cssPath = (style as ts.StringLiteral).text;

      const cssText = readTemplate(tsFilePath, cssPath);

      const result = cssParser.parsePostCSS(cssText);

      return ts.factory.createStringLiteral(result);
    });

    properties.push(ts.factory.createPropertyAssignment(
        ts.factory.createIdentifier("styles"),
        ts.factory.createArrayLiteralExpression(
            styleUrls
        )
    ));

  }

  if (ts.isClassDeclaration(node)) {
    const { inputs, outputs } = extractInputsOutputs(node);

    if (inputs.length > 0) {
      properties.push(
          ts.factory.createPropertyAssignment(
              ts.factory.createIdentifier("inputs"),
              ts.factory.createObjectLiteralExpression(
                  inputs.map(input => ts.factory.createPropertyAssignment(input.key, input.value))
              )
          )
      )
    }

    if (outputs.length > 0) {
      properties.push(
          ts.factory.createPropertyAssignment(
              ts.factory.createIdentifier("outputs"),
              ts.factory.createObjectLiteralExpression(
                  outputs.map(output => ts.factory.createPropertyAssignment(output.key, output.value))
              )
          )
      )
    }
  }

  return properties;
}

function parseDirectiveSelector(selector: string) {

  let collectSelector = false
  let selected = ""
  let parts = []

  for (let i = 0; i < selector.length; i++) {
    const current = selector[i];

    if (current === "[") {
      collectSelector = true
      continue
    }

    if (current === "]") {
      parts.push(selected)
      collectSelector = false
      selected = ""
      continue
    }

    if (collectSelector) {
      selected += current
    }

  }

  return parts;

}

function readTemplate(tsFilePath: string, templateUrl: string) {
  const dir = path.dirname(tsFilePath);
  const fullPath = path.resolve(dir, templateUrl);
  return fs.readFileSync(fullPath, 'utf-8');
}

function generateTemplateInstructions(componentName: string, templateString: string) {

    const context = "ctx";
    const renderFlag = "rf";
    const functionName = componentName + "_Template";

    const parser = new Parser(templateString);
    const { block, consts, templateStmts} = parser.parse();

    const template = ts.factory.createPropertyAssignment(
            "template",
            ts.factory.createFunctionExpression(
                undefined,
                undefined,
                functionName,
                undefined,
                [
                  ts.factory.createParameterDeclaration(
                      undefined,
                      undefined,
                      renderFlag,
                      undefined,
                      undefined,
                      undefined
                  ),
                  ts.factory.createParameterDeclaration(
                      undefined,
                      undefined,
                      context,
                      undefined,
                      undefined,
                      undefined
                  ),
                ],
                undefined,
                block
            )
        )


    // consts
    const constsExpr = ts.factory.createPropertyAssignment(
        ts.factory.createIdentifier("consts"),
        ts.factory.createArrayLiteralExpression(
            consts
        )
    );

    return  {
      templateNode: template,
      constsNode: constsExpr,
      templateStmts
    }

}

function preserveExport(modifiers: ts.ModifierLike[]/*node: ts.ClassDeclaration*/): ts.Modifier[] | undefined {
  if (!modifiers) return undefined;
  const exportModifier = modifiers.find(
    (m) => m.kind === ts.SyntaxKind.ExportKeyword,
  );
  if (exportModifier) {
    return [ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)];
  }
  return undefined;
}

export function updateClassDeclaration(
  node: ts.ClassDeclaration,
  newMembers: ts.ClassElement[],
) {

  const members = node.members.map(m =>
      stripDecoratorsFromMember(m, ts.factory)
  );

  const strippedNewMembers = newMembers.map(m =>
      stripDecoratorsFromMember(m, ts.factory)
  );

  let modifiers = node.modifiers.filter(
      m => m.kind !== ts.SyntaxKind.Decorator
  );

  modifiers = preserveExport(modifiers);

  return ts.factory.updateClassDeclaration(
    node,
    modifiers, // keeps 'export'
    node.name,
    node.typeParameters,
    node.heritageClauses,
    [...members, ...strippedNewMembers], // static blocks
  );

}

function stripDecoratorsFromMember(
    member: ts.ClassElement,
    factory: ts.NodeFactory
): ts.ClassElement {

  if (!ts.canHaveDecorators(member)) return member;

  const decorators = ts.getDecorators(member);
  if (!decorators?.length) return member;

  if (ts.isPropertyDeclaration(member)) {
    return factory.createPropertyDeclaration(
        ts.getModifiers(member), // keep modifiers
        member.name,
        member.questionToken ?? member.exclamationToken,
        member.type,
        member.initializer
    );
  }

  return member;
}

export function createClassStaticBlock(node: ts.Block) {
  return ts.factory.createClassStaticBlockDeclaration(node);
}

function generateTemplateStmts(templateStmts: Template[], sourceFile: ts.SourceFile, hoisted: ts.Statement[]) {

  templateStmts.forEach(node => {

    const creationNode = ts.factory.createIfStatement(
        factory.createBinaryExpression(
            ts.factory.createIdentifier(rf),
            ts.SyntaxKind.AmpersandToken,
            ts.factory.createIdentifier("1")
        ),
        ts.factory.createBlock([...node.stmts], true),
        undefined
    );

    const updateNode = factory.createIfStatement(
        factory.createBinaryExpression(
            factory.createIdentifier(rf),
            ts.SyntaxKind.AmpersandToken,
            factory.createIdentifier("2")
        ),
        factory.createBlock([...node.updateStmts], true),
        undefined
    )

    const block = ts.factory.createBlock([creationNode, updateNode], true);

    const functionDecl = ts.factory.createFunctionDeclaration(
        [],
        undefined,
        node.functionName,
        [],
        [
          ts.factory.createParameterDeclaration([], undefined, "ctx"),
          ts.factory.createParameterDeclaration([], undefined, "rf"),
        ],
        undefined,
        block,
    )

    hoisted.push(functionDecl)

    if (node.templateStmts) {
      generateTemplateStmts(node.templateStmts, sourceFile, hoisted)
    }

  })

}
