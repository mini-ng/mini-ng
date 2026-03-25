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
    abstract visitIdentifier(expr: IdentifierAST);
    abstract visitLiteral(expr: LiteralAST);
    abstract visitUnary(expr: UnaryAST);
    abstract visitBinary(expr: BinaryAST);

    abstract visitPropertyRead(expr: PropertyReadAST);
    abstract visitPropertyWrite(expr: PropertyWriteAST);
    abstract visitSafePropertyRead(expr: SafePropertyReadAST);

    abstract visitCall(expr: CallAST);
    abstract visitSafeCall(expr: SafeCallAST);

    abstract visitConditional(expr: ConditionalAST);
    abstract visitSequence(expr: SequenceAST);

    abstract visitPipe(expr: BindingPipeAST);
    abstract visitGrouping(expr: GroupingAST);

    abstract visitArrayLiteral(expr: ArrayLiteralAST);
    abstract visitObjectLiteral(expr: ObjectLiteralAST);

    abstract visitAssignment(expr: AssignmentAST);
    abstract visitNonNullAssert(expr: NonNullAssertAST);

    abstract visitThis(expr: ThisAST);
    abstract visitTrue(expr: TrueBooleanAST);
    abstract visitFalse(expr: FalseBooleanAST);
    abstract visitNull(expr: NullAST);
    abstract visitUndefined(expr: UndefinedAST);
}

export abstract class AstExpression {
    abstract accept(visitor: AstVisitor): any;
}

export class Literal implements AstExpression, LiteralAST {
    name: string;

    accept(visitor: AstVisitor): void {
        return visitor.visitLiteral(this);
    }

    type: "Literal";
    value: string | number;
    valueType: LiteralAstType;

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

export class ObjectLiteral implements AstExpression, ObjectLiteralAST {
    accept(visitor: AstVisitor): any {
    }

    properties: { key: string; value: AST }[];
    type: "ObjectLiteral";
}

export class ArrayLiteral implements AstExpression {

    constructor(public elements: AstExpression[]) {}

    accept(visitor: AstVisitor): any {
    }

}

export class This implements AstExpression, ThisAST {
    accept(visitor: AstVisitor): any {
    }

    type: "This";
}

export class SafeCall implements AstExpression, SafeCallAST {
    accept(visitor: AstVisitor): any {
    }

    args: AstExpression[];
    receiver: AstExpression;
    type: "SafeCall";
}

export class SafePropertyRead implements AstExpression, SafePropertyReadAST {
    accept(visitor: AstVisitor): any {
    }

    name: string;
    receiver: AstExpression;
    type: "SafePropertyRead";
}

export class PropertyWrite implements AstExpression, PropertyWriteAST {
    accept(visitor: AstVisitor): any {
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
    }
}

export class BindingPipe implements AstExpression, BindingPipeAST {
    args: AST[];
    expression: AST;
    name: string;
    type: "Pipe";

    accept(visitor: AstVisitor): any {
    }
}

export class Sequence implements AstExpression, SequenceAST {
    expressions: AST[];
    type: "Sequence";

    accept(visitor: AstVisitor): any {
        return visitor.visitSequence(this);
    }
}

export class Conditional implements AstExpression, ConditionalAST {
    alternate: AstExpression;
    consequent: AstExpression;
    test: AstExpression;
    type: "Conditional";

    accept(visitor: AstVisitor): any {
        return visitor.visitConditional(this);
    }
}

export class Call implements AstExpression, CallAST {
    args: AST[];
    callee: AST;
    type: "Call";

    accept(visitor: AstVisitor): any {
        return visitor.visitCall(this);
    }
}

export class PropertyRead implements AstExpression, PropertyReadAST {
    computed: boolean;
    key: string | AstExpression;
    receiver: AstExpression | null;
    type: "PropertyRead";

    accept(visitor: AstVisitor): any {
        return visitor.visitPropertyRead(this);
    }
}

export class Binary implements AstExpression, BinaryAST {
    left: AstExpression;
    operator: string;
    right: AstExpression;
    type: "Binary";

    accept(visitor: AstVisitor): any {
        return visitor.visitBinary(this);
    }
}

export class PrefixUnary implements AstExpression, UnaryAST {
    argument: AstExpression;
    operator: string;
    type: "Unary";

    constructor(public token: Token, public expr: AstExpression) {}


    accept(visitor: AstVisitor): any {
        return visitor.visitUnary(this);
    }
}

export class PrefixUpdate implements AstExpression {
    argument: AST;
    operator: string;
    type: "Unary";

    constructor(public token: Token, public expr: AstExpression) {}

    accept(visitor: AstVisitor): any {
    }
}

export class PostfixUpdate implements AstExpression {
    argument: AST;
    operator: string;
    type: "Unary";

    constructor(public token: Token, public expr: AstExpression) {}

    accept(visitor: AstVisitor): any {
    }
}

export class Comma implements AstExpression {

    constructor(public left: AstExpression, public right: AstExpression) {}

    accept(visitor: AstVisitor): any {
    }

}

export class YieldExpression implements AstExpression {

    constructor(public argument: AstExpression, public delegate: boolean) {}

    accept(visitor: AstVisitor): any {
    }

}

export class New implements AstExpression {

    constructor(public ctor: AstExpression, public args: AstExpression[]) {}

    accept(visitor: AstVisitor): any {
    }

}

export class Spread implements AstExpression {
    constructor(public expression: AstExpression) {}

    accept(visitor: AstVisitor): any {
    }
}
