import {
    ArrayLiteral,
    Assignment,
    AstExpression,
    AstVisitor,
    Binary,
    BindingPipe,
    Call,
    Comma,
    Conditional,
    False,
    Grouping,
    Identifier,
    Literal,
    New,
    NonNullAssert,
    Null,
    ObjectLiteral,
    PostfixUpdate,
    PrefixUnary,
    PrefixUpdate,
    PropertyRead,
    PropertyWrite,
    SafeCall,
    SafePropertyRead,
    Sequence,
    SpreadElement,
    This,
    True,
    Undefined,
    YieldExpression,
    ArrowFunction
} from "../ast/ast-impl";
import ts from "typescript";
import {LiteralAstType} from "../ast/ast";
import {operatorMap, TokenType} from "../expression_parser/tokens";

const factory = ts.factory

export class TemplateVisitor extends AstVisitor {
    private ctx: string = "ctx";

    visitOperator(operator: TokenType): ts.SyntaxKind {

        let kind = operatorMap[operator];

        if (kind === undefined) {
            throw new Error(`Unknown operator: ${TokenType[operator]}`);
        }

        return kind;
    }

    visitBinary(visitor: Binary) {

        const expr = this.visitOperator(visitor.operator.token);
        const left = (visitor.left as AstExpression).accept(this);
        const right = (visitor.right as AstExpression).accept(this);

        return ts.factory.createBinaryExpression(
            left, expr as ts.BinaryOperator, right
        )

    }

    visitCall(visitor: Call) {
        return factory.createCallExpression(
            visitor.callee.accept(this),
            undefined,
            visitor.args.map(arg => arg.accept(this))
        )
    }

    visitIdentifier(expr: Identifier) {

        // return ts.factory.createPropertyAccessExpression(
        //     ts.factory.createIdentifier(this.ctx),
            return ts.factory.createIdentifier(expr.name)
        // );

    }

    visitLiteral(expr: Literal) {

        if (expr.valueType === LiteralAstType.STRING) {
            return ts.factory.createStringLiteral(expr.value as string)
        }

        if (expr.valueType === LiteralAstType.NUMBER) {
            return ts.factory.createNumericLiteral(expr.value)
        }
    }

    visitSequence(visitor: Sequence) {
    }

    visitArrayLiteral(arrayLiteral: ArrayLiteral) {

        const elements = arrayLiteral.elements.map(arrayLit => {
            return arrayLit.accept(this)
        });

        return factory.createArrayLiteralExpression(
            elements,
            false
        );
    }

    visitAssignment(assignment: Assignment) {
        return factory.createBinaryExpression(
            assignment.left.accept(this),
            factory.createToken(ts.SyntaxKind.EqualsToken),
            assignment.right.accept(this),
        )
    }

    visitConditional(conditional: Conditional) {
        return factory.createConditionalExpression(
            conditional.test.accept(this),
            factory.createToken(ts.SyntaxKind.QuestionToken),
            conditional.consequent.accept(this),
            factory.createToken(ts.SyntaxKind.ColonToken),
            conditional.alternate.accept(this),
        )
    }

    visitFalse(expr: False) {
        return ts.factory.createFalse()
    }

    visitGrouping(expr: Grouping) {
    }

    visitNonNullAssert(expr: NonNullAssert) {
    }

    visitNull(expr: Null) {
        return ts.factory.createNull();
    }

    visitObjectLiteral(expr: ObjectLiteral) {

        const props = expr.properties.map(prop => {
            return factory.createPropertyAssignment(
                prop.key.accept(this),
                prop.value.accept(this)
            )
        });

        return factory.createObjectLiteralExpression(
            props,
            false
        )

    }

    visitPipe(expr: BindingPipe) {
    }

    visitPropertyRead(propertyRead: PropertyRead) {

        if (propertyRead.computed) {
            return factory.createElementAccessExpression(
                propertyRead.receiver.accept(this),
                (propertyRead.key as AstExpression).accept(this),
            )
        }

        return factory.createPropertyAccessExpression(
            propertyRead.receiver.accept(this),
            (propertyRead.key as string)
        );

    }

    visitPropertyWrite(expr: PropertyWrite) {}

    visitSafeCall(expr: SafeCall) {
        return factory.createCallChain(
            expr.callee.accept(this),
            factory.createToken(ts.SyntaxKind.QuestionDotToken),
            undefined,
            expr.args.map(arg => arg.accept(this))
        )
    }

    visitSafePropertyRead(expr: SafePropertyRead) {
        return factory.createPropertyAccessChain(
            expr.computed ? (expr.name as AstExpression).accept(this) : expr.name,
            factory.createToken(ts.SyntaxKind.QuestionDotToken),
            expr.receiver.accept(this),
        )
    }

    visitThis(expr: This) {
        return ts.factory.createThis()
    }

    visitTrue(expr: True) {
        return ts.factory.createTrue();
    }

    visitUndefined(expr: Undefined) {
        return ts.factory.createIdentifier("undefined");
    }

    visitBindingPipe(param: BindingPipe) {
    }

    visitComma(param: Comma) {
        return factory.createParenthesizedExpression(factory.createBinaryExpression(
            param.left.accept(this),
            factory.createToken(ts.SyntaxKind.CommaToken),
            param.right.accept(this),
        ))
    }

    visitNew(param: New) {
        return factory.createNewExpression(
            param.ctor.accept(this),
            null,
            param.args.map(arg => arg.accept(this))
        )
    }

    visitPostfixUpdate(param: PostfixUpdate) {
        return factory.createPostfixUnaryExpression(
            param.expr.accept(this),
            this.visitOperator(param.token.token) as ts.PostfixUnaryOperator
        )
    }

    visitPrefixUpdate(param: PrefixUpdate) {
        return factory.createPrefixUnaryExpression(
            this.visitOperator(param.token.token) as ts.PrefixUnaryOperator,
            param.expr.accept(this),
        )
    }

    visitSpreadElement(param: SpreadElement) {
        return factory.createSpreadElement(param.expression.accept(this))
    }

    visitYieldExpression(param: YieldExpression) {
        return factory.createYieldExpression(
            param.delegate ? factory.createToken(ts.SyntaxKind.AsteriskToken) : undefined,
            param.argument.accept(this),
        )
    }

    visitPrefixUnary(param: PrefixUnary) {
        return factory.createPrefixUnaryExpression(
            this.visitOperator(param.token.token) as ts.PrefixUnaryOperator,
            param.argument.accept(this)
        )
    }

    visitArrowFunction(param: ArrowFunction) {
    }

}
