import ts from "typescript";
import * as o from "./../ir/output_ast"
import {
    ArrayLiteralExpr,
    ConditionalExpr,
    FalseExpr,
    GroupingExpr,
    IdentifierExpr,
    LiteralExpr,
    NewExpr,
    ObjectLiteralExpr,
    SafeCallExpr,
    SpreadElementExpr,
    TrueExpr,
    YieldExpressionExpr
} from "../ir/expression";
import {LiteralAstType} from "../html_parser/ast/ast";

class Context {
    withStatementMode: string;
}

export class ExpressionTranslatorVisitor
    implements o.ExpressionVisitor, o.StatementVisitor {

    private readonly factory = ts.factory

    visitExpressionStmt(stmt: o.ExpressionStatement, context: Context) {
        return this.factory.createExpressionStatement(
            stmt.expr.visitExpression(this, context?.withStatementMode),
        )
    }

    visitInvokeFunctionExpr(ast: o.InvokeFunctionExpr, context: Context) {
        console.log(ast)
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
    }

    visitLiteralExpr(param: LiteralExpr, context: any) {
        console.log(param)
        if (param.valueType === LiteralAstType.NUMBER) {
            return this.factory.createNumericLiteral(param.value)
        }
        if (param.valueType === LiteralAstType.STRING) {
            return this.factory.createStringLiteral(param.value as string)
        }
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
        // if (ast.value.name === null) {
        //     if (ast.value.moduleName === null) {
        //         throw new Error('Invalid import without name nor moduleName');
        //     }
        //     return this.imports.addImport({
        //         exportModuleSpecifier: ast.value.moduleName,
        //         exportSymbolName: null,
        //         requestedFile: this.contextFile,
        //     });
        // }
        // // If a moduleName is specified, this is a normal import. If there's no module name, it's a
        // // reference to a global/ambient symbol.
        // if (ast.value.moduleName !== null) {
        //     // This is a normal import. Find the imported module.
        //     return this.imports.addImport({
        //         exportModuleSpecifier: ast.value.moduleName,
        //         exportSymbolName: ast.value.name,
        //         requestedFile: this.contextFile,
        //     });
        // } else {
        //     // The symbol is ambient, so just reference it.
        //     return this.factory.createIdentifier(ast.value.name);
        // }

        console.log(ast)
        return this.factory.createIdentifier(ast.value.name);

    }

}
