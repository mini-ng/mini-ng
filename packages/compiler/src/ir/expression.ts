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
import {Token, TokenType} from "../html_parser/expression_parser/tokens";
import {
    ConsumesVars,
    ConsumesVarsTrait,
    ExpressionTransform, SlotHandle,
    transformExpressionsInExpression,
    UsesVarOffset,
    VisitorContextFlag, XrefId
} from "./ir";
import {ExpressionVisitor} from "./visitor";
import {Type} from "./output_ast";

export type Expression = BindingPipeExpr;

export enum ExpressionKind {
    PipeBinding,
    ConditionalCase,
}

export abstract class ExpressionBase extends o.Expression {
    abstract readonly kind: ExpressionKind;

    protected constructor() {
        super(null);
    }

    abstract transformInternalExpressions(transform: ExpressionTransform, flags: VisitorContextFlag): void;
}

export class BindingPipeExpr extends ExpressionBase implements ConsumesVars, UsesVarOffset {
    override readonly kind = ExpressionKind.PipeBinding;

    varOffset: number | null = null;
    readonly [ConsumesVarsTrait] = true;
    readonly [UsesVarOffset] = true;

    constructor(
        readonly target: XrefId,
        readonly targetSlot: SlotHandle,
        public name: string,
        public args:  o.Expression[],
        type?:  Type | null
    ) {
        super();
    }

    clone():  o.Expression {
        return undefined;
    }

    isConstant(): boolean {
        return false;
    }

    isEquivalent(e:  o.Expression): boolean {
        return false;
    }

    visitExpression(visitor: ExpressionVisitor, context: any): any {
        for (const arg of this.args) {
            arg.visitExpression(visitor, context);
        }
    }

    transformInternalExpressions(transform: ExpressionTransform, flags: VisitorContextFlag) {
        this.args = this.args.map((arg) => {
            return transformExpressionsInExpression(arg, transform, flags);
        });
    }

}

export class ConditionalCaseExpr extends ExpressionBase {
    override readonly kind = ExpressionKind.ConditionalCase;

    constructor(
        public expr:  o.Expression | null,
        readonly target: XrefId,
        readonly targetSlot: SlotHandle,
    ) {
        super();
    }

    override visitExpression(visitor: ExpressionVisitor, context: any): any {
        if (this.expr !== null) {
            this.expr.visitExpression(visitor, context);
        }
    }

    override isEquivalent(e: o.Expression): boolean {
        return false
        // return e instanceof ConditionalCaseExpr && e.expr === this.expr;
    }

    override isConstant() {
        return true;
    }

    override clone(): ConditionalCaseExpr {
        return new ConditionalCaseExpr(this.expr, this.target, this.targetSlot);
    }

    override transformInternalExpressions(
        transform: ExpressionTransform,
        flags: VisitorContextFlag,
    ): void {
        if (this.expr !== null) {
            this.expr = transformExpressionsInExpression(this.expr, transform, flags);
        }
    }
}
