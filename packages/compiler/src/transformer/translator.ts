import * as o from "./../ir/output_ast"
import {
    ArrayLiteralExpr, CallExpr,
    ConditionalExpr,
    FalseExpr, FunctionExpr,
    GroupingExpr,
    IdentifierExpr,
    NewExpr,
    ObjectLiteralExpr, ReadVariable,
    SafeCallExpr,
    SpreadElementExpr,
    TrueExpr,
    YieldExpressionExpr
} from "../ir/expression";
import {DeclareFunctionStmt, IfStmt, LiteralExpr, ReturnStatement} from "./../ir/output_ast";
import {ExpressionVisitor} from "../ir/visitor";
import {ImportGenerator} from "./import-generator/import-generator";
import {AstFactory} from "./ast-factory/ast-factory";
import ts from "typescript";

class Context {
    withStatementMode: string;
}

export class ExpressionTranslatorVisitor
    implements ExpressionVisitor, o.StatementVisitor {

    constructor(
        private factory: AstFactory,
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
            ast.args.map((arg) => arg.visitExpression(this, context)),
            ast.pure
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
        return this.factory.createLiteral(param.value)
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
        if (ast.value.name === null) {
            if (ast.value.moduleName === null) {
                throw new Error('Invalid import without name nor moduleName');
            }
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
            });
        } else {
            // The symbol is ambient, so just reference it.
            return this.factory.createIdentifier(ast.value.name);
        }

    }

    visitDeclareFunctionStmt(stmt: DeclareFunctionStmt, context: any): any {
        return this.factory.createFunctionStatement(
            stmt.name ?? null,
            stmt.params.map((param) => param.name),
            this.visitStatements(stmt.statements, context)
        )
    }

    visitFunctionExpr(ast: FunctionExpr, context: any): any {
        return this.factory.createFunctionExpression(
            ast.name ?? null,
            ast.params.map((param) => param.name),
            this.visitStatements(ast.statements, context),
        );

    }

    visitIfStmt(stmt: IfStmt, context: any): any {
    }

    visitReturnStmt(stmt: ReturnStatement, context: any): any {
        return this.factory.createReturnStatement(
            stmt.value.visitExpression(this, context?.withExpressionMode),
        )
    }

    private visitStatements(statements: o.Statement[], context: Context): ts.Statement[] {
        return statements
            .map((stmt) => stmt.visitStatement(this, context))
            .filter((stmt) => stmt !== undefined);
    }

    visitCallExpr(ast: CallExpr, context: any): any {
        return this.factory.createCallExpression(
            ast.callee.visitExpression(this, context),
            ast.args.map((arg) => arg.visitExpression(this, context)),
            false
        )
    }

    visitReadVariable(param: ReadVariable, context: any): any {
        return this.factory.createIdentifier(param.value)
    }

}
