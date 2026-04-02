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
import {Expression, ExpressionVisitor, Type} from "./output_ast";
import {Token} from "../html_parser/expression_parser/tokens";
import {LiteralAstType} from "../html_parser/ast/ast";
import {ConsumesVars, ConsumesVarsTrait, UsesVarOffset} from "./ir";

export enum ExpressionKind {
    PipeBinding,
}

export abstract class ExpressionBase extends Expression {
    abstract readonly kind: ExpressionKind;
}

export class BindingPipeExpr extends ExpressionBase implements ConsumesVars, UsesVarOffset {
    override readonly kind = ExpressionKind.PipeBinding;

    varOffset: number | null = null;
    readonly [ConsumesVarsTrait] = true;
    readonly [UsesVarOffset] = true;

    constructor(
        public args: Expression[],
        type?: Type | null
    ) {
        super(type);
    }

    clone(): Expression {
        return undefined;
    }

    isConstant(): boolean {
        return false;
    }

    isEquivalent(e: Expression): boolean {
        return false;
    }

    visitExpression(visitor: ExpressionVisitor, context: any): any {
        for (const arg of this.args) {
            arg.visitExpression(visitor, context);
        }
    }

}

export class CommaExpr extends Expression {

    constructor(
        public left: Expression,
        public right: Expression,
        type?: Type | null
    ) {
        super(type);
    }

    clone(): Expression {
        return undefined;
    }

    isConstant(): boolean {
        return false;
    }

    isEquivalent(e: Expression): boolean {
        return false;
    }

    visitExpression(visitor: ExpressionVisitor, context: any): any {
    }

}

export class SpreadElementExpr extends Expression {

    constructor(
        public expression: Expression,
        type?: Type | null
    ) {
        super(type);
    }

    clone(): Expression {
        return undefined;
    }

    isConstant(): boolean {
        return false;
    }

    isEquivalent(e: Expression): boolean {
        return false;
    }

    visitExpression(visitor: ExpressionVisitor, context: any): any {
        return visitor.visitSpreadElementExpr(this, context)
    }

}

export class YieldExpressionExpr extends Expression {

    constructor(
        public argument: Expression, public delegate: boolean, type?: Type | null) {
        super(type);}

    clone(): Expression {
        return undefined;
    }

    isConstant(): boolean {
        return false;
    }

    isEquivalent(e: Expression): boolean {
        return false;
    }

    visitExpression(visitor: ExpressionVisitor, context: any): any {
        return visitor.visitYieldExpressionExpr(this, context)
    }

}

export class ArrowFunctionExpr extends Expression {

    constructor(
        public params: Expression[],
        public body: Expression[],
        type?: Type | null
    ) {
        super(type);

    }

    clone(): Expression {
        return undefined;
    }

    isConstant(): boolean {
        return false;
    }

    isEquivalent(e: Expression): boolean {
        return false;
    }

    visitExpression(visitor: ExpressionVisitor, context: any): any {
    }

}

export class IdentifierExpr extends Expression {

    constructor(public name: string,
                type?: Type | null) {
        super(type);
    }

    clone(): Expression {
        return undefined;
    }

    isConstant(): boolean {
        return false;
    }

    isEquivalent(e: Expression): boolean {
        return false;
    }

    visitExpression(visitor: ExpressionVisitor, context: any): any {
        return visitor.visitIdentifierExpr(this, context)
    }

}

export class ConditionalExpr extends Expression {

    constructor(
        public alternate: Expression,
    public consequent: Expression,
    public test: Expression,
    type?: Type | null
) {
        super(type);
    }

    clone(): Expression {
        return undefined;
    }

    isConstant(): boolean {
        return false;
    }

    isEquivalent(e: Expression): boolean {
        return false;
    }

    visitExpression(visitor: ExpressionVisitor, context: any): any {
        return visitor.visitConditionalExpr(this, context)
    }

}

export class BinaryExpr extends Expression {

    constructor(
        public left: Expression,
        public right: Expression,
        public operator: Token,
        type?: Type | null
    ) {
        super(type);
    }

    clone(): Expression {
        return undefined;
    }

    isConstant(): boolean {
        return false;
    }

    isEquivalent(e: Expression): boolean {
        return false;
    }

    visitExpression(visitor: ExpressionVisitor, context: any): any {
    }

}

export class PrefixUnaryExpr extends Expression {

    constructor(
        public token: Token,
        public argument: AstExpression,
        type?: Type | null) {
        super(type);
    }

    clone(): Expression {
        return undefined;
    }

    isConstant(): boolean {
        return false;
    }

    isEquivalent(e: Expression): boolean {
        return false;
    }

    visitExpression(visitor: ExpressionVisitor, context: any): any {
    }

}

export class PrefixUpdateExpr extends Expression {

    constructor(
        public token: Token,
        public expr: Expression,
        type?: Type | null) {
        super(type);
    }

    clone(): Expression {
        return undefined;
    }

    isConstant(): boolean {
        return false;
    }

    isEquivalent(e: Expression): boolean {
        return false;
    }

    visitExpression(visitor: ExpressionVisitor, context: any): any {
    }

}

export class PostfixUpdateExpr extends Expression {

    constructor(
        public token: Token,
        public expr: Expression,
        type?: Type | null) {
        super(type);
    }

    clone(): Expression {
        return undefined;
    }

    isConstant(): boolean {
        return false;
    }

    isEquivalent(e: Expression): boolean {
        return false;
    }

    visitExpression(visitor: ExpressionVisitor, context: any): any {
    }

}

export class PropertyReadExpr extends Expression {

    constructor(
        public receiver: Expression,
        public key: string | Expression,
        public computed: boolean = false,
        type?: Type | null) {
        super(type);
    }

    clone(): Expression {
        return undefined;
    }

    isConstant(): boolean {
        return false;
    }

    isEquivalent(e: Expression): boolean {
        return false;
    }

    visitExpression(visitor: ExpressionVisitor, context: any): any {
    }

}

export class SafePropertyReadExpr extends Expression {

    constructor(
        public receiver: AstExpression,
        public name: string | AstExpression,
        public computed: boolean = false,
        type?: Type | null) {
        super(type);
    }

    clone(): Expression {
        return undefined;
    }

    isConstant(): boolean {
        return false;
    }

    isEquivalent(e: Expression): boolean {
        return false;
    }

    visitExpression(visitor: ExpressionVisitor, context: any): any {
    }

}

export class CallExpr extends Expression {

    constructor(
        public callee: Expression,
        public args: Expression[],
        type?: Type | null) {
        super(type);
    }

    clone(): Expression {
        return undefined;
    }

    isConstant(): boolean {
        return false;
    }

    isEquivalent(e: Expression): boolean {
        return false;
    }

    visitExpression(visitor: ExpressionVisitor, context: any): any {
    }

}

export class SafeCallExpr extends Expression {

    constructor(
        public callee: Expression, public args: Expression[],
        type?: Type | null) {
        super(type);}

    clone(): Expression {
        return undefined;
    }

    isConstant(): boolean {
        return false;
    }

    isEquivalent(e: Expression): boolean {
        return false;
    }

    visitExpression(visitor: ExpressionVisitor, context: any): any {
        return visitor.visitSafeCallExpr(this, context)
    }

}

export class NewExpr extends Expression {

    constructor(
        public ctor: Expression,
        public args: Expression[],
        type?: Type | null,) {
        super(type);
    }

    clone(): Expression {
        return undefined;
    }

    isConstant(): boolean {
        return false;
    }

    isEquivalent(e: Expression): boolean {
        return false;
    }

    visitExpression(visitor: ExpressionVisitor, context: any): any {
        return visitor.visitNewExpr(this, context)
    }

}

export class LiteralExpr extends Expression {

    constructor(
        public value: string | number,
        public valueType: LiteralAstType,
        type?: Type | null,) {
        super(type)}

    clone(): Expression {
        return undefined;
    }

    isConstant(): boolean {
        return false;
    }

    isEquivalent(e: Expression): boolean {
        return false;
    }

    visitExpression(visitor: ExpressionVisitor, context: any): any {
        return visitor.visitLiteralExpr(this, context)
    }

}

export class TrueExpr extends Expression {

    constructor(type?: Type | null) {
        super(type);
    }

    clone(): Expression {
        return undefined;
    }

    isConstant(): boolean {
        return false;
    }

    isEquivalent(e: Expression): boolean {
        return false;
    }

    visitExpression(visitor: ExpressionVisitor, context: any): any {
        return visitor.visitTrueExpr(this, context)
    }

}

export class FalseExpr extends Expression {

    constructor(type?: Type | null) {
        super(type);
    }

    clone(): Expression {
        return undefined;
    }

    isConstant(): boolean {
        return false;
    }

    isEquivalent(e: Expression): boolean {
        return false;
    }

    visitExpression(visitor: ExpressionVisitor, context: any): any {
        return visitor.visitFalseExpr(this, context)
    }

}

export class GroupingExpr extends Expression {

    constructor(
        public expression: Expression,
        type?: Type | null) {
        super(type);
    }

    clone(): Expression {
        return undefined;
    }

    isConstant(): boolean {
        return false;
    }

    isEquivalent(e: Expression): boolean {
        return false;
    }

    visitExpression(visitor: ExpressionVisitor, context: any): any {
        return visitor.visitGroupingExpr(this, context)
    }

}

export class ArrayLiteralExpr extends Expression {

    constructor(public elements: Expression[],
                type?: Type | null) {
        super(type);
    }

    clone(): Expression {
        return undefined;
    }

    isConstant(): boolean {
        return false;
    }

    isEquivalent(e: Expression): boolean {
        return false;
    }

    visitExpression(visitor: ExpressionVisitor, context: any): any {
        return visitor.visitArrayLiteralExpr(this, context)
    }

}

export class ObjectLiteralExpr extends Expression {

    constructor(public properties: ObjectProperty[], type?: Type | null) {
        super(type);
    }

    clone(): Expression {
        return undefined;
    }

    isConstant(): boolean {
        return false;
    }

    isEquivalent(e: Expression): boolean {
        return false;
    }

    visitExpression(visitor: ExpressionVisitor, context: any): any {
        return visitor.visitObjectLiteral(this, context)
    }

}

