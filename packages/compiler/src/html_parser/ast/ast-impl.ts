import {
    ArrayLiteralAST,
    AssignmentAST, AST, ASTWithSource,
    BinaryAST,
    BindingPipeAST,
    CallAST,
    ConditionalAST,
    FalseBooleanAST,
    GroupingAST,
    IdentifierAST,
    LiteralAST,
    LiteralAstType,
    NonNullAssertAST,
    NullAST,
    ObjectLiteralAST,
    PropertyReadAST,
    PropertyWriteAST,
    SafeCallAST,
    SafePropertyReadAST,
    SequenceAST,
    ThisAST,
    TrueBooleanAST,
    UnaryAST,
    UndefinedAST
} from "./ast";
import {Token} from "../expression_parser/tokens";

export abstract class AstVisitor {
    abstract visitIdentifier(expr: Identifier);
    abstract visitLiteral(expr: Literal);
    abstract visitBinary(expr: Binary);

    abstract visitPropertyRead(expr: PropertyRead);
    abstract visitPropertyWrite(expr: PropertyWrite);
    abstract visitSafePropertyRead(expr: SafePropertyRead);

    abstract visitCall(expr: Call);
    abstract visitSafeCall(expr: SafeCall);

    abstract visitConditional(expr: Conditional);
    abstract visitSequence(expr: Sequence);

    abstract visitPipe(expr: BindingPipe);
    abstract visitGrouping(expr: Grouping);

    abstract visitArrayLiteral(expr: ArrayLiteral);
    abstract visitObjectLiteral(expr: ObjectLiteral);

    abstract visitAssignment(expr: Assignment);
    abstract visitNonNullAssert(expr: NonNullAssert);

    abstract visitThis(expr: This);
    abstract visitTrue(expr: True);
    abstract visitFalse(expr: False);
    abstract visitNull(expr: Null);
    abstract visitUndefined(expr: Undefined);

    abstract visitComma(param: Comma);
    abstract visitPostfixUpdate(param: PostfixUpdate);
    abstract visitPrefixUpdate(param: PrefixUpdate);

    abstract visitBindingPipe(param: BindingPipe);

    abstract visitYieldExpression(param: YieldExpression);

    abstract visitNew(param: New);
    abstract visitSpread(param: Spread);

    abstract visitPrefixUnary(param: PrefixUnary);
}

export abstract class AstExpression {
    abstract accept(visitor: AstVisitor): any;
}

export class Literal implements AstExpression {

    constructor(public value: string | number, public valueType: LiteralAstType) {}

    accept(visitor: AstVisitor): void {
        return visitor.visitLiteral(this);
    }

}

export class Identifier implements AstExpression, IdentifierAST {
    type: "Identifier";

    accept(visitor: AstVisitor) {
        return visitor.visitIdentifier(this);
    }

    name: string;

}

export class True implements AstExpression, TrueBooleanAST {
    accept(visitor: AstVisitor) {
        return visitor.visitTrue(this);
    }

}

export class False implements AstExpression, FalseBooleanAST {
    accept(visitor: AstVisitor) {
        return visitor.visitFalse(this);
    }

}

export class Null implements AstExpression, NullAST {
    accept(visitor: AstVisitor) {
        return visitor.visitNull(this);
    }

}

export class Undefined implements AstExpression, UndefinedAST {
    accept(visitor: AstVisitor) {
        return visitor.visitUndefined(this);
    }

}

export class NonNullAssert implements AstExpression, NonNullAssertAST {
    accept(visitor: AstVisitor): any {
        visitor.visitNonNullAssert(this)
    }

    expression: AstExpression;
    type: "NonNullAssert";
}

export class Assignment implements AstExpression, AssignmentAST {
    accept(visitor: AstVisitor): any {
        return visitor.visitAssignment(this);
    }

    left: AstExpression;
    right: AstExpression;
    type: "Assignment";
}

export interface ObjectProperty {
    key: AstExpression;
    value: AstExpression;
}

export class ObjectLiteral implements AstExpression {

    constructor(public properties: ObjectProperty[]) {}

    accept(visitor: AstVisitor): any {
        return visitor.visitObjectLiteral(this);
    }

}

export class ArrayLiteral implements AstExpression {

    constructor(public elements: AstExpression[]) {}

    accept(visitor: AstVisitor): any {
        return visitor.visitArrayLiteral(this)
    }

}

export class This implements AstExpression {
    accept(visitor: AstVisitor): any {
        visitor.visitThis(this);
    }

}

export class SafePropertyRead implements AstExpression {

    constructor(public receiver: AstExpression, public name: string | AstExpression, public computed: boolean = false) {}

    accept(visitor: AstVisitor): any {
        visitor.visitSafePropertyRead(this);
    }

}

export class PropertyWrite implements AstExpression, PropertyWriteAST {
    accept(visitor: AstVisitor): any {
        visitor.visitPropertyWrite(this);
    }

    name: string;
    receiver: AstExpression;
    type: "PropertyWrite";
    value: AstExpression;
}

export class Grouping implements AstExpression, GroupingAST {
    expression: AST;
    type: "Grouping";

    accept(visitor: AstVisitor): any {
        visitor.visitGrouping(this);
    }
}

export class BindingPipe implements AstExpression, BindingPipeAST {
    args: AST[];
    expression: AST;
    name: string;
    type: "Pipe";

    accept(visitor: AstVisitor): any {
        visitor.visitBindingPipe(this)
    }
}

export class Sequence implements AstExpression, SequenceAST {
    expressions: AST[];
    type: "Sequence";

    accept(visitor: AstVisitor): any {
        return visitor.visitSequence(this);
    }
}

export class Conditional implements AstExpression {
    alternate: AstExpression;
    consequent: AstExpression;
    test: AstExpression;
    type: "Conditional";

    accept(visitor: AstVisitor): any {
        return visitor.visitConditional(this);
    }
}

export class Call implements AstExpression {

    constructor(public callee: AstExpression, public args: AstExpression[]) {}

    accept(visitor: AstVisitor): any {
        return visitor.visitCall(this);
    }
}

export class SafeCall implements AstExpression {

    constructor(public callee: AstExpression, public args: AstExpression[]) {}

    accept(visitor: AstVisitor): any {
        return visitor.visitSafeCall(this);
    }

}

export class PropertyRead implements AstExpression {

    constructor(public receiver: AstExpression, public key: string | AstExpression, public computed: boolean = false) {}

    accept(visitor: AstVisitor): any {
        return visitor.visitPropertyRead(this);
    }
}

export class Binary implements AstExpression, BinaryAST {
    left: AstExpression;
    operator: Token;
    right: AstExpression;
    type: "Binary";

    accept(visitor: AstVisitor): any {
        return visitor.visitBinary(this);
    }
}

export class PrefixUnary implements AstExpression {

    constructor(public token: Token, public argument: AstExpression) {}


    accept(visitor: AstVisitor): any {
        return visitor.visitPrefixUnary(this);
    }
}

export class PrefixUpdate implements AstExpression {
    argument: AST;
    operator: string;
    type: "Unary";

    constructor(public token: Token, public expr: AstExpression) {}

    accept(visitor: AstVisitor): any {
        visitor.visitPrefixUpdate(this)
    }
}

export class PostfixUpdate implements AstExpression {
    argument: AST;
    operator: string;
    type: "Unary";

    constructor(public token: Token, public expr: AstExpression) {}

    accept(visitor: AstVisitor): any {
        visitor.visitPostfixUpdate(this)
    }
}

export class Comma implements AstExpression {

    constructor(public left: AstExpression, public right: AstExpression) {}

    accept(visitor: AstVisitor): any {
        visitor.visitComma(this)
    }

}

export class YieldExpression implements AstExpression {

    constructor(public argument: AstExpression, public delegate: boolean) {}

    accept(visitor: AstVisitor): any {
        visitor.visitYieldExpression(this)
    }

}

export class New implements AstExpression {

    constructor(public ctor: AstExpression, public args: AstExpression[]) {}

    accept(visitor: AstVisitor): any {
        visitor.visitNew(this)
    }

}

export class Spread implements AstExpression {
    constructor(public expression: AstExpression) {}

    accept(visitor: AstVisitor): any {
        visitor.visitSpread(this)
    }
}
