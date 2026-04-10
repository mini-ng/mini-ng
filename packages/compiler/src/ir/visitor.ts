import {
    ArrayLiteralExpr, CallExpr, ConditionalExpr,
    FalseExpr, FunctionExpr,
    GroupingExpr, IdentifierExpr,
    NewExpr,
    ObjectLiteralExpr, ReadVariable, SafeCallExpr, SpreadElementExpr,
    TrueExpr, YieldExpressionExpr
} from "./expression";
import {ExternalExpr, InvokeFunctionExpr, LiteralExpr} from "./output_ast";

export interface ExpressionVisitor {
    visitInvokeFunctionExpr(ast: InvokeFunctionExpr, context: any): any;

    visitExternalExpr(ast: ExternalExpr, context: any): any;

    visitObjectLiteral(param: ObjectLiteralExpr, context: any): any;

    visitArrayLiteralExpr(param: ArrayLiteralExpr, context: any): any;

    visitFalseExpr(param: FalseExpr, context: any): any;

    visitTrueExpr(param: TrueExpr, context: any): any;

    visitLiteralExpr(param: LiteralExpr, context: any): void;

    visitGroupingExpr(param: GroupingExpr, context: any): any;

    visitNewExpr(param: NewExpr, context: any): any;

    visitSafeCallExpr(param: SafeCallExpr, context: any): any;

    visitConditionalExpr(param: ConditionalExpr, context: any): any;

    visitIdentifierExpr(param: IdentifierExpr, context: any): any;

    visitSpreadElementExpr(param: SpreadElementExpr, context: any): any;

    visitYieldExpressionExpr(param: YieldExpressionExpr, context: any): any;

    visitFunctionExpr(param: FunctionExpr, context: any): any;

    visitCallExpr(param: CallExpr, context: any): any;

    visitReadVariable(param: ReadVariable, context: any): any;
}
