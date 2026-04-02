import {
    ArrayLiteralExpr, ConditionalExpr,
    FalseExpr,
    GroupingExpr, IdentifierExpr, LiteralExpr,
    NewExpr,
    ObjectLiteralExpr,
    SafeCallExpr, SpreadElementExpr,
    TrueExpr, YieldExpressionExpr
} from "./expression";
import {ArrayLiteral} from "../html_parser/ast/ast-impl";
import {LiteralAstType} from "../html_parser/ast/ast";

export enum TypeModifier {
    None = 0,
    Const = 1 << 0,
}

export abstract class Type {
    constructor(public modifiers: TypeModifier = TypeModifier.None) {}
    // abstract visitType(visitor: TypeVisitor, context: any): any;

    hasModifier(modifier: TypeModifier): boolean {
        return (this.modifiers & modifier) !== 0;
    }
}

export class ExternalReference {
    constructor(
        public moduleName: string | null,
        public name: string | null,
    ) {}
}

export abstract class Expression {
    public type: Type | null;

    constructor(type: Type | null | undefined) {
        this.type = type || null;
    }

    abstract visitExpression(visitor: ExpressionVisitor, context: any): any;

    abstract isEquivalent(e: Expression): boolean;

    abstract isConstant(): boolean;

    abstract clone(): Expression;

    callFn(
        params: Expression[],
        pure?: boolean,
    ): InvokeFunctionExpr {
        return new InvokeFunctionExpr(this, params, null, pure);
    }
}

export function literal(
    value: any,
    type?: Type | null,
    valueType?: LiteralAstType | null,
) {
    return new LiteralExpr(value, valueType, type);
}

export function importExpr(
    id: ExternalReference,
    typeParams: Type[] | null = null,
): ExternalExpr {
    return new ExternalExpr(id, null, typeParams);
}

export class ExternalExpr extends Expression {
    constructor(
        public value: ExternalReference,
        type?: Type | null,
        public typeParams: Type[] | null = null,
    ) {
        super(type);
    }

    override isEquivalent(e: Expression): boolean {
        return (
            e instanceof ExternalExpr &&
            this.value.name === e.value.name &&
            this.value.moduleName === e.value.moduleName
        );
    }

    override isConstant() {
        return false;
    }

    override visitExpression(visitor: ExpressionVisitor, context: any): any {
        return visitor.visitExternalExpr(this, context);
    }

    override clone(): ExternalExpr {
        return new ExternalExpr(this.value, this.type, this.typeParams);
    }
}

export class InvokeFunctionExpr extends Expression {
    constructor(
        public fn: Expression,
        public args: Expression[],
        type?: Type | null,
        public pure = false,
    ) {
        super(type);
    }

    override isEquivalent(e: Expression): boolean {
        return (
            e instanceof InvokeFunctionExpr &&
            this.pure === e.pure
        );
    }

    override isConstant() {
        return false;
    }

    override visitExpression(visitor: ExpressionVisitor, context: any): any {
        return visitor.visitInvokeFunctionExpr(this, context);
    }

    override clone(): InvokeFunctionExpr {
        return new InvokeFunctionExpr(
            this.fn,
            this.args.map((arg) => arg),
            this.type,
            this.pure,
        );
    }

}

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
}

export enum StmtModifier {
    None = 0,
    Final = 1 << 0,
    Private = 1 << 1,
    Exported = 1 << 2,
    Static = 1 << 3,
}
export interface StatementVisitor {
    // visitDeclareVarStmt(stmt: DeclareVarStmt, context: any): any;
    // visitDeclareFunctionStmt(stmt: DeclareFunctionStmt, context: any): any;
    visitExpressionStmt(stmt: ExpressionStatement, context: any): any;
    // visitReturnStmt(stmt: ReturnStatement, context: any): any;
    // visitIfStmt(stmt: IfStmt, context: any): any;
}

export abstract class Statement {
    constructor(
        public modifiers: StmtModifier = StmtModifier.None,
    ) {}

    abstract isEquivalent(stmt: Statement): boolean;

    abstract visitStatement(visitor: StatementVisitor, context: any): any;

    hasModifier(modifier: StmtModifier): boolean {
        return (this.modifiers & modifier) !== 0;
    }
}

export class ExpressionStatement extends Statement {
    constructor(
        public expr: Expression,
    ) {
        super(StmtModifier.None);
    }
    override isEquivalent(stmt: Statement): boolean {
        return stmt instanceof ExpressionStatement && this.expr.isEquivalent(stmt.expr);
    }
    override visitStatement(visitor: StatementVisitor, context: any): any {
        return visitor.visitExpressionStmt(this, context);
    }
}
