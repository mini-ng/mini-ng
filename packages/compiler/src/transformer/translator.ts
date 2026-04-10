import * as o from "./../ir/output_ast"
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

    visitArrayLiteralExpr(param: o.ArrayLiteralExpr, context: any): any {
        return this.factory.createArrayLiteral(
            param.elements.map(el => el.visitExpression(this, context))
        )
    }

    visitConditionalExpr(ast: o.ConditionalExpr, context: any): any {
        return this.factory.createConditional(
            ast.test.visitExpression(this, context),
            ast.consequent.visitExpression(this, context),
            ast.alternate.visitExpression(this, context)
        )
    }

    visitFalseExpr(param: o.FalseExpr, context: any): any {
        return this.factory.createBooleanLiteral(false)
    }

    visitGroupingExpr(param: o.GroupingExpr, context: any): any {
    }

    visitIdentifierExpr(param: o.IdentifierExpr, context: any): any {
        return this.factory.createIdentifier(param.name)
    }

    visitLiteralExpr(param: LiteralExpr, context: any) {
        return this.factory.createLiteral(param.value)
    }

    visitNewExpr(param: o.NewExpr, context: any): any {
        return this.factory.createNew(param.ctor.visitExpression(this, context), param.args.map((arg) => arg.visitExpression(this, context)))
    }

    visitObjectLiteral(param: o.ObjectLiteralExpr, context: any): any {
        // return this.factory.createObjectLiteral(
        //     param.properties.map(prop => {
        //         return {
        //             key: prop.key.visitExpression(this, context),
        //             value: prop.value.visitExpression(this, context)
        //         }
        //     })
        // )
    }

    visitSafeCallExpr(param: o.SafeCallExpr, context: any): any {
    }

    visitSpreadElementExpr(param: o.SpreadElementExpr, context: any): any {
        const expression = param.expression.visitExpression(this, context);
        return this.factory.createSpreadElement(expression);
    }

    visitTrueExpr(param: o.TrueExpr, context: any): any {
        return this.factory.createBooleanLiteral(true)
    }

    visitYieldExpressionExpr(param: o.YieldExpressionExpr, context: any): any {
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

    visitFunctionExpr(ast: o.FunctionExpr, context: any): any {
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

    visitCallExpr(ast: o.CallExpr, context: any): any {
        return this.factory.createCallExpression(
            ast.callee.visitExpression(this, context),
            ast.args.map((arg) => arg.visitExpression(this, context)),
            false
        )
    }

    visitReadVariable(param: o.ReadVariable, context: any): any {
        return this.factory.createIdentifier(param.value.toString())
    }

}
