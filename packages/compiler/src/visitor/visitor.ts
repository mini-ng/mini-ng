import * as ts from "typescript";
import {
  classHasDecorator,
  createDefineComponentStatic,
  createFactoryStatic,
  extractComponentMetadata,
  getComponentDecorator,
  hasComponentDecorator,
  updateClassDeclaration,
} from "../transformer/transformer";
import {createDefineDirectiveStatic, createHostBinding, hasDirectiveDecorator} from "./directive_visitor";
import {stripQuotes} from "../utils/utils";
import {isClassDeclaration} from "typescript";
import {createDefinePipeStatic} from "./pipe_visitor";
import {createDefineInjectableStatic} from "./injectable_visitor";

export type DirectivesToInject = { fromMiniNgCore: boolean; parameter: ts.ParameterDeclaration; }

export function transformPlugin(
  program: ts.Program,
): ts.TransformerFactory<ts.SourceFile> | ts.CustomTransformerFactory {
  return (context) => {
    const factory = context.factory;

    const hoisted: ts.Statement[] = [];
    let miniNgCoreImports = []

    function visit(node: ts.Node): ts.Node {
      // we need to skip comments

      if (ts.isEmptyStatement(node)) {
        return factory.createEmptyStatement();
      }

      if (ts.isDecorator(node)) {
        return ts.visitEachChild(node, visit, context);
      }

      const { isClassDecorator, isComponent, isDirective, isPipe, isInjectable} = hasClassDecorator(node)

      if (ts.isClassDeclaration(node) && isClassDecorator) {

        // we need to check if the constructor has arguments
        const directivesToInject: DirectivesToInject[]  = []

        node.members.find(element => {
          if (ts.isConstructorDeclaration(element)) {
            (element).parameters.forEach((parameter) => {

              directivesToInject.push({
                fromMiniNgCore: miniNgCoreImports.includes(stripQuotes(parameter.type.getText())),
                parameter
              });

            })
          }
        })

        const componentName = node.name?.text;

        const metadata = extractComponentMetadata(getComponentDecorator(node));

        const factoryNode = createFactoryStatic(node.name?.text, node, directivesToInject);

        let cmpDefNode = null;

        if (isDirective) {
          cmpDefNode = createDefineDirectiveStatic(componentName, metadata, node, hoisted, createHostBinding(node, metadata))
        } else if (isComponent) {
          cmpDefNode = createDefineComponentStatic(componentName, metadata, node, hoisted);
        } else if (isInjectable) {
          cmpDefNode = createDefineInjectableStatic(componentName, metadata, node, hoisted)
        } else if (isPipe) {
          cmpDefNode = createDefinePipeStatic(componentName, metadata, node, hoisted)
        }

        miniNgCoreImports = []

        return updateClassDeclaration(node, [factoryNode, cmpDefNode]);
      }

      return ts.visitEachChild(node, visit, context);
    }

    return (sourceFile: ts.SourceFile) => {

      ts.forEachChild(sourceFile, node => {
        if (ts.isImportDeclaration(node)) {

          const moduleName = node.moduleSpecifier.getText();

          if (stripQuotes(moduleName.trim()) === "@mini-ng/core") {
            (node.importClause.namedBindings as ts.NamedImports).elements.forEach((element) => {
              miniNgCoreImports.push(element.name.escapedText)
            })
          }

        }
      });

      // check if import from "@mini-ng/core" exists
      let hasMiniNgImport = sourceFile.statements.some(
        (stmt) =>
          ts.isImportDeclaration(stmt) &&
          ts.isStringLiteral(stmt.moduleSpecifier) &&
          stmt.moduleSpecifier.text === "@mini-ng/core",
      );

      if (hasMiniNgImport) {
        const importStatement = factory.createImportDeclaration(
           undefined,
           factory.createImportClause(
             false,
             undefined,
            factory.createNamespaceImport(factory.createIdentifier("i0")),
          ),
           factory.createStringLiteral("@mini-ng/core"),
           undefined,
        );

        // Prepend the import at the top
        sourceFile = factory.updateSourceFile(sourceFile, [
            ...insertStatementAfterLastImportStmt(sourceFile.statements, [importStatement])
        ]);
      }

      const visited = ts.visitNode(sourceFile, visit) as ts.SourceFile;
      return context.factory.updateSourceFile(
          visited,
          insertStatementAfterLastImportStmt(visited.statements, hoisted)
      );
    };
  };
}

function insertStatementAfterLastImportStmt(statements, hoisted) {
  const lastImportIndex = findLastImportIndex(statements);

  const updatedStatements = [
    ...statements.slice(0, lastImportIndex + 1),
          ...hoisted,
    ...statements.slice(lastImportIndex + 1),
  ];

  return updatedStatements
}

function findLastImportIndex(statements: readonly ts.Statement[]): number {
  let lastImport = -1;

  for (let i = 0; i < statements.length; i++) {
    if (ts.isImportDeclaration(statements[i])) {
      lastImport = i;
    } else {
      break; // imports are always at the top
    }
  }

  return lastImport;
}

function isFromMiniNgCore(
    param: ts.ParameterDeclaration,
    checker: ts.TypeChecker
): boolean {

  if (!param.type || !ts.isTypeReferenceNode(param.type)) {
    return false;
  }

  const symbol = checker.getSymbolAtLocation(
      param.type.typeName
  );

  if (!symbol) return false;

  const resolved =
      symbol.flags & ts.SymbolFlags.Alias
          ? checker.getAliasedSymbol(symbol)
          : symbol;

  const declarations = resolved.getDeclarations();
  if (!declarations?.length) return false;

  const fileName = declarations[0].getSourceFile().fileName;

  return fileName.includes("node_modules/@mini-ng/core");
}

function hasClassDecorator(node: ts.Node | ts.ClassDeclaration) {

  if (!ts.isClassDeclaration(node)) {
    return {}
  }

  const isComponent =  hasComponentDecorator(node);
  const isDirective = hasDirectiveDecorator(node);
  const isPipe = classHasDecorator(node, "Pipe");
  const isInjectable = classHasDecorator(node, "Injectable");

  return {
    isClassDecorator: isComponent || isDirective || isPipe || isInjectable,
    isComponent,
    isDirective,
    isInjectable,
    isPipe
  }

}
