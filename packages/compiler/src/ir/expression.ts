import {
    ArrayLiteral,
    ArrowFunction, AstExpression,
    Binary,
    Call,
    Comma,
    Conditional,
    False,
    Grouping,
    Identifier,
    Literal,
    New,
    ObjectLiteral, ObjectProperty,
    PostfixUpdate,
    PrefixUnary,
    PrefixUpdate,
    PropertyRead,
    SafeCall,
    SafePropertyRead,
    SpreadElement,
    True,
    YieldExpression
} from "../html_parser/ast/ast-impl";
import * as o from "./output_ast";
import {Token} from "../html_parser/expression_parser/tokens";
import {ConsumesVars, ConsumesVarsTrait, ExpressionTransform, UsesVarOffset, VisitorContextFlag} from "./ir";
import {ExpressionVisitor} from "./visitor";

export enum ExpressionKind {
    PipeBinding,
}

export abstract class ExpressionBase extends o.Expression {
    abstract readonly kind: ExpressionKind;

    protected constructor() {
        super(null);
    }

    transformInternalExpressions(transform: ExpressionTransform, flags: VisitorContextFlag) {

    }
}

export class BindingPipeExpr extends ExpressionBase implements ConsumesVars, UsesVarOffset {
    override readonly kind = ExpressionKind.PipeBinding;

    varOffset: number | null = null;
    readonly [ConsumesVarsTrait] = true;
    readonly [UsesVarOffset] = true;

    constructor(
        public name: string,
        public args: o.Expression[],
        type?: o.Type | null
    ) {
        super();
    }

    clone(): o.Expression {
        return undefined;
    }

    isConstant(): boolean {
        return false;
    }

    isEquivalent(e: o.Expression): boolean {
        return false;
    }

    visitExpression(visitor: ExpressionVisitor, context: any): any {
        for (const arg of this.args) {
            arg.visitExpression(visitor, context);
        }
    }

}

export class CommaExpr extends o.Expression {

    constructor(
        public left: o.Expression,
        public right: o.Expression,
        type?: o.Type | null
    ) {
        super(type);
    }

    clone(): o.Expression {
        return undefined;
    }

    isConstant(): boolean {
        return false;
    }

    isEquivalent(e: o.Expression): boolean {
        return false;
    }

    visitExpression(visitor:  ExpressionVisitor, context: any): any {
    }

}

export class SpreadElementExpr extends o.Expression {

    constructor(
        public expression: o.Expression,
        type?: o.Type | null
    ) {
        super(type);
    }

    clone(): o.Expression {
        return undefined;
    }

    isConstant(): boolean {
        return false;
    }

    isEquivalent(e: o.Expression): boolean {
        return false;
    }

    visitExpression(visitor:  ExpressionVisitor, context: any): any {
        return visitor.visitSpreadElementExpr(this, context)
    }

}

export class YieldExpressionExpr extends o.Expression {

    constructor(
        public argument: o.Expression, public delegate: boolean, type?: o.Type | null) {
        super(type);}

    clone(): o.Expression {
        return undefined;
    }

    isConstant(): boolean {
        return false;
    }

    isEquivalent(e: o.Expression): boolean {
        return false;
    }

    visitExpression(visitor:  ExpressionVisitor, context: any): any {
        return visitor.visitYieldExpressionExpr(this, context)
    }

}

export class ArrowFunctionExpr extends o.Expression {

    constructor(
        public params: o.Expression[],
        public body: o.Expression[],
        type?: o.Type | null
    ) {
        super(type);

    }

    clone(): o.Expression {
        return undefined;
    }

    isConstant(): boolean {
        return false;
    }

    isEquivalent(e: o.Expression ): boolean {
        return false;
    }

    visitExpression(visitor:  ExpressionVisitor, context: any): any {
    }

}

export class IdentifierExpr extends o.Expression {

    constructor(public name: string,
                type?: o.Type | null) {
        super(type);
    }

    clone(): o.Expression {
        return undefined;
    }

    isConstant(): boolean {
        return false;
    }

    isEquivalent(e: o.Expression ): boolean {
        return false;
    }

    visitExpression(visitor:  ExpressionVisitor, context: any): any {
        return visitor.visitIdentifierExpr(this, context)
    }

}

export class ConditionalExpr extends o.Expression {

    constructor(
        public alternate: o.Expression ,
    public consequent: o.Expression ,
    public test: o.Expression ,
    type?: o.Type | null
) {
        super(type);
    }

    clone(): o.Expression {
        return undefined;
    }

    isConstant(): boolean {
        return false;
    }

    isEquivalent(e: o.Expression ): boolean {
        return false;
    }

    visitExpression(visitor:  ExpressionVisitor, context: any): any {
        return visitor.visitConditionalExpr(this, context)
    }

}

export class BinaryExpr extends o.Expression {

    constructor(
        public left: o.Expression ,
        public right: o.Expression ,
        public operator: Token,
        type?: o.Type | null
    ) {
        super(type);
    }

    clone(): o.Expression {
        return undefined;
    }

    isConstant(): boolean {
        return false;
    }

    isEquivalent(e: o.Expression ): boolean {
        return false;
    }

    visitExpression(visitor:  ExpressionVisitor, context: any): any {
    }

}

export class PrefixUnaryExpr extends o.Expression {

    constructor(
        public token: Token,
        public argument: AstExpression,
        type?: o.Type | null) {
        super(type);
    }

    clone(): o.Expression {
        return undefined;
    }

    isConstant(): boolean {
        return false;
    }

    isEquivalent(e: o.Expression): boolean {
        return false;
    }

    visitExpression(visitor: ExpressionVisitor, context: any): any {
    }

}

export class PrefixUpdateExpr extends o.Expression {

    constructor(
        public token: Token,
        public expr: o.Expression,
        type?: o.Type | null) {
        super(type);
    }

    clone(): o.Expression {
        return undefined;
    }

    isConstant(): boolean {
        return false;
    }

    isEquivalent(e: o.Expression): boolean {
        return false;
    }

    visitExpression(visitor: ExpressionVisitor, context: any): any {
    }

}

export class PostfixUpdateExpr extends o.Expression {

    constructor(
        public token: Token,
        public expr: o.Expression,
        type?: o.Type | null) {
        super(type);
    }

    clone(): o.Expression {
        return undefined;
    }

    isConstant(): boolean {
        return false;
    }

    isEquivalent(e: o.Expression): boolean {
        return false;
    }

    visitExpression(visitor: ExpressionVisitor, context: any): any {
    }

}

export class PropertyReadExpr extends o.Expression {

    constructor(
        public receiver: o.Expression,
        public key: string | o.Expression,
        public computed: boolean = false,
        type?: o.Type | null) {
        super(type);
    }

    clone(): o.Expression {
        return undefined;
    }

    isConstant(): boolean {
        return false;
    }

    isEquivalent(e: o.Expression): boolean {
        return false;
    }

    visitExpression(visitor: ExpressionVisitor, context: any): any {
    }

}

export class SafePropertyReadExpr extends o.Expression {

    constructor(
        public receiver: AstExpression,
        public name: string | AstExpression,
        public computed: boolean = false,
        type?: o.Type | null) {
        super(type);
    }

    clone(): o.Expression {
        return undefined;
    }

    isConstant(): boolean {
        return false;
    }

    isEquivalent(e: o.Expression): boolean {
        return false;
    }

    visitExpression(visitor: ExpressionVisitor, context: any): any {
    }

}

export class CallExpr extends o.Expression {

    constructor(
        public callee: o.Expression,
        public args: o.Expression[],
        type?: o.Type | null) {
        super(type);
    }

    clone(): o.Expression {
        return undefined;
    }

    isConstant(): boolean {
        return false;
    }

    isEquivalent(e: o.Expression): boolean {
        return false;
    }

    visitExpression(visitor: ExpressionVisitor, context: any): any {
    }

}

export class SafeCallExpr extends o.Expression {

    constructor(
        public callee: o.Expression, public args: o.Expression[],
        type?: o.Type | null) {
        super(type);}

    clone(): o.Expression {
        return undefined;
    }

    isConstant(): boolean {
        return false;
    }

    isEquivalent(e: o.Expression): boolean {
        return false;
    }

    visitExpression(visitor:  ExpressionVisitor, context: any): any {
        return visitor.visitSafeCallExpr(this, context)
    }

}

export class NewExpr extends o.Expression {

    constructor(
        public ctor: o.Expression,
        public args: o.Expression[],
        type?: o.Type | null,) {
        super(type);
    }

    clone(): o.Expression {
        return undefined;
    }

    isConstant(): boolean {
        return false;
    }

    isEquivalent(e: o.Expression): boolean {
        return false;
    }

    visitExpression(visitor:  ExpressionVisitor, context: any): any {
        return visitor.visitNewExpr(this, context)
    }

}

export class TrueExpr extends o.Expression {

    constructor(type?: o.Type | null) {
        super(type);
    }

    clone(): o.Expression {
        return undefined;
    }

    isConstant(): boolean {
        return false;
    }

    isEquivalent(e: o.Expression): boolean {
        return false;
    }

    visitExpression(visitor:  ExpressionVisitor, context: any): any {
        return visitor.visitTrueExpr(this, context)
    }

}

export class FalseExpr extends o.Expression {

    constructor(type?: o.Type | null) {
        super(type);
    }

    clone(): o.Expression {
        return undefined;
    }

    isConstant(): boolean {
        return false;
    }

    isEquivalent(e: o.Expression): boolean {
        return false;
    }

    visitExpression(visitor:  ExpressionVisitor, context: any): any {
        return visitor.visitFalseExpr(this, context)
    }

}

export class GroupingExpr extends o.Expression {

    constructor(
        public expression: o.Expression,
        type?: o.Type | null) {
        super(type);
    }

    clone(): o.Expression {
        return undefined;
    }

    isConstant(): boolean {
        return false;
    }

    isEquivalent(e: o.Expression): boolean {
        return false;
    }

    visitExpression(visitor:  ExpressionVisitor, context: any): any {
        return visitor.visitGroupingExpr(this, context)
    }

}

export class ArrayLiteralExpr extends o.Expression {

    constructor(public elements: o.Expression[],
                type?: o.Type | null) {
        super(type);
    }

    clone(): o.Expression {
        return undefined;
    }

    isConstant(): boolean {
        return false;
    }

    isEquivalent(e: o.Expression): boolean {
        return false;
    }

    visitExpression(visitor:  ExpressionVisitor, context: any): any {
        return visitor.visitArrayLiteralExpr(this, context)
    }

}

export class ObjectLiteralExpr extends o.Expression {

    constructor(public properties: { value: o.Expression; key: o.Expression }[], type?: o.Type | null) {
        super(type);
    }

    clone(): o.Expression {
        return undefined;
    }

    isConstant(): boolean {
        return false;
    }

    isEquivalent(e: o.Expression): boolean {
        return false;
    }

    visitExpression(visitor:  ExpressionVisitor, context: any): any {
        return visitor.visitObjectLiteral(this, context)
    }

}

export class FunctionExpr extends o.Expression {
    constructor(
        public params: o.FnParam[],
        public statements: o.Statement[],
        type?: o.Type | null,
        public name?: string | null,
    ) {
        super(type);
    }


    override isConstant() {
        return false;
    }

    override visitExpression(visitor:  ExpressionVisitor, context: any): any {
        return visitor.visitFunctionExpr(this, context);
    }

    toDeclStmt(name: string, modifiers?: o.StmtModifier): o.DeclareFunctionStmt {
        return new o.DeclareFunctionStmt(
            name,
            this.params,
            this.statements,
            this.type,
        );
    }

    clone(): o.Expression {
        return undefined;
    }

    isEquivalent(e: o.Expression): boolean {
        return false;
    }

}
