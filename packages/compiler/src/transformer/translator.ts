import ts from "typescript";
import * as o from "./../ir/output_ast"
import {
    ArrayLiteralExpr,
    ConditionalExpr,
    FalseExpr, FunctionExpr,
    GroupingExpr,
    IdentifierExpr,
    NewExpr,
    ObjectLiteralExpr,
    SafeCallExpr,
    SpreadElementExpr,
    TrueExpr,
    YieldExpressionExpr
} from "../ir/expression";
import {LiteralAstType} from "../html_parser/ast/ast";
import {DeclareFunctionStmt, IfStmt, LiteralExpr, ReturnStatement} from "./../ir/output_ast";
import {ExpressionVisitor} from "../ir/visitor";
import {ImportGenerator} from "./import-generator/import-generator";

class Context {
    withStatementMode: string;
}

export class ExpressionTranslatorVisitor
    implements ExpressionVisitor, o.StatementVisitor {

    private readonly factory = ts.factory
    constructor(
        // private factory: AstFactory<TStatement, TExpression>,
        private imports: ImportGenerator,
    ) {
    }

    visitExpressionStmt(stmt: o.ExpressionStatement, context: Context) {
        return this.factory.createExpressionStatement(
            stmt.expr.visitExpression(this, context?.withStatementMode),
        )
    }

    visitInvokeFunctionExpr(ast: o.InvokeFunctionExpr, context: Context) {
        return this.factory.createCallExpression(
                ast.fn.visitExpression(this, context),
                undefined,
               ast.args.map((arg) => arg.visitExpression(this, context)),
            )
    }

    visitArrayLiteralExpr(param: ArrayLiteralExpr, context: any): any {
    }

    visitConditionalExpr(param: ConditionalExpr, context: any): any {
    }

    visitFalseExpr(param: FalseExpr, context: any): any {
    }

    visitGroupingExpr(param: GroupingExpr, context: any): any {
    }

    visitIdentifierExpr(param: IdentifierExpr, context: any): any {
        return this.factory.createIdentifier(param.name)
    }

    visitLiteralExpr(param: LiteralExpr, context: any) {

        if (param.valueType === LiteralAstType.NUMBER) {
            return this.factory.createNumericLiteral(+param.value)
        }
        if (param.valueType === LiteralAstType.STRING) {
            return this.factory.createStringLiteral(param.value as string)
        }

        return this.factory.createNull()
    }

    visitNewExpr(param: NewExpr, context: any): any {
    }

    visitObjectLiteral(param: ObjectLiteralExpr, context: any): any {
    }

    visitSafeCallExpr(param: SafeCallExpr, context: any): any {
    }

    visitSpreadElementExpr(param: SpreadElementExpr, context: any): any {
    }

    visitTrueExpr(param: TrueExpr, context: any): any {
    }

    visitYieldExpressionExpr(param: YieldExpressionExpr, context: any): any {
    }

    visitExternalExpr(ast: o.ExternalExpr, _context: Context) {
        console.log(ast)
        if (ast.value.name === null) {
            if (ast.value.moduleName === null) {
                throw new Error('Invalid import without name nor moduleName');
            }
            // return this.imports.addImport({
            //     exportModuleSpecifier: ast.value.moduleName,
            //     exportSymbolName: null,
            //     requestedFile: null, //this.contextFile,
            // });
            return this.imports.addImport({
                module: ast.value.moduleName,
                name: null,
            });
        }
        // If a moduleName is specified, this is a normal import. If there's no module name, it's a
        // reference to a global/ambient symbol.
        if (ast.value.moduleName !== null) {
            // This is a normal import. Find the imported module.
            return this.imports.addImport({
                module: ast.value.moduleName,
                name: ast.value.name,
                // requestedFile: null, // this.contextFile,
            });
        } else {
            // The symbol is ambient, so just reference it.
            return this.factory.createIdentifier(ast.value.name);
        }

    }

    visitDeclareFunctionStmt(stmt: DeclareFunctionStmt, context: any): any {
    }

    visitFunctionExpr(param: FunctionExpr, context: any): any {
        return this.factory.createFunctionExpression(
            undefined, undefined,
            param.name ?? null, undefined,
            param.params.map((param) => ts.factory.createParameterDeclaration(undefined, undefined, param.name)), undefined,
            this.factory.createBlock(this.visitStatements(param.statements, context)),
        );
    }

    visitIfStmt(stmt: IfStmt, context: any): any {
    }

    visitReturnStmt(stmt: ReturnStatement, context: any): any {
    }

    private visitStatements(statements: o.Statement[], context: Context) {
        return statements
            .map((stmt) => stmt.visitStatement(this, context))
            .filter((stmt) => stmt !== undefined);
    }

}
