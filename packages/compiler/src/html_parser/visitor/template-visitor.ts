import {
    ArrayLiteral,
    Assignment,
    AstExpression,
    AstVisitor,
    Binary, BindingPipe, Call,
    Comma,
    Conditional, False, Grouping,
    Identifier,
    Literal,
    New, NonNullAssert, Null,
    ObjectLiteral,
    PostfixUpdate,
    PrefixUnary,
    PrefixUpdate,
    PropertyRead,
    PropertyWrite,
    SafeCall,
    SafePropertyRead,
    Sequence,
    Spread,
    This, True, Undefined, YieldExpression,
} from "../ast/ast-impl";
import ts from "typescript";
import {LiteralAstType} from "../ast/ast";

const factory = ts.factory

export class TemplateVisitor extends AstVisitor {
    private ctx: string = "ctx";

    visitOperator(operator: string) {

        let kind;

        switch (operator) {

            case "+": {
                kind = ts.SyntaxKind.PlusToken;
                break;
            }

            case "-": {
                kind = ts.SyntaxKind.MinusToken;
                break;
            }

            case "/": {
                kind = ts.SyntaxKind.SlashToken;
                break;
            }

            case "*": {
                kind = ts.SyntaxKind.AsteriskToken;
                break;
            }

            case "<": {
                kind = ts.SyntaxKind.LessThanToken
                break;
            }

            case "<<": {
                kind = ts.SyntaxKind.LessThanLessThanToken
                break;

            }

            case "<=": {
                kind = ts.SyntaxKind.LessThanEqualsToken
                break;
            }

            case ">": {
                kind = ts.SyntaxKind.GreaterThanToken
                break;
            }

            case ">>": {
                kind = ts.SyntaxKind.GreaterThanGreaterThanToken
                break;
            }

            case ">>>": {
                kind = ts.SyntaxKind.GreaterThanGreaterThanGreaterThanToken
                break;
            }

            case ">=": {
                kind = ts.SyntaxKind.GreaterThanEqualsToken
                break;
            }

            case "&": {
                kind = ts.SyntaxKind.AmpersandToken;
                break;
            }

            case "&&": {
                kind = ts.SyntaxKind.AmpersandAmpersandToken;
                break;
            }

            case "||": {
                kind = ts.SyntaxKind.BarBarEqualsToken
                break;
            }

            case "!": {
                kind = ts.SyntaxKind.ExclamationToken;
                break;
            }

            case "++": {
                kind = ts.SyntaxKind.PlusPlusToken
                break;
            }

        }

        return kind;
    }

    visitBinary(visitor: Binary) {

        const expr = this.visitOperator(visitor.operator);
        const left = (visitor.left as AstExpression).accept(this);
        const right = (visitor.right as AstExpression).accept(this);

        return ts.factory.createBinaryExpression(
            left, expr, right
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

        return ts.factory.createPropertyAccessExpression(
            ts.factory.createIdentifier(this.ctx),
            ts.factory.createIdentifier(expr.name)
        );

    }

    visitLiteral(expr: Literal) {
        if (expr.valueType === LiteralAstType.STRING) {
            return ts.factory.createStringLiteral(expr.name)
        }

        if (expr.valueType === LiteralAstType.NUMBER) {
            return ts.factory.createNumericLiteral(expr.value)
        }
    }

    visitMember(visitor: AstVisitor) {
    }

    visitSequence(visitor: Sequence) {
    }

    visitArrayLiteral(arrayLiteral: ArrayLiteral) {
        return factory.createArrayLiteralExpression(
            arrayLiteral.elements.map(arrayLit => arrayLit.accept(this)),
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
                factory.createIdentifier(prop.key),
                prop.value.accept(this)
            )
        })

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
            this.visitOperator(param.token.value)
        )
    }

    visitPrefixUpdate(param: PrefixUpdate) {
        return factory.createPrefixUnaryExpression(
            this.visitOperator(param.token.value),
            param.expr.accept(this),
        )
    }

    visitSpread(param: Spread) {
    }

    visitYieldExpression(param: YieldExpression) {
    }

    visitPrefixUnary(param: PrefixUnary) {
        return factory.createPrefixUnaryExpression(
            this.visitOperator(param.token.value),
            param.argument.accept(this)
        )
    }

}
