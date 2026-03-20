import {AstExpression, AstVisitor, Identifier, Literal, Sequence, Unary} from "../html_parser/ast/ast-impl";
import ts from "typescript";
import {
    ArrayLiteralAST,
    AssignmentAST,
    BinaryAST,
    BindingPipeAST,
    CallAST,
    ConditionalAST,
    FalseBooleanAST,
    GroupingAST,
    LiteralAstType,
    NonNullAssertAST,
    NullAST,
    ObjectLiteralAST,
    PropertyReadAST,
    PropertyWriteAST,
    SafeCallAST,
    SafePropertyReadAST, ThisAST, TrueBooleanAST, UndefinedAST
} from "../html_parser/ast/ast";

export class TemplateVisitor extends AstVisitor {

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

        }

        return kind;
    }

    visitBinary(visitor: BinaryAST) {

        const expr = this.visitOperator(visitor.operator);
        const left = (visitor.left as AstExpression).accept(this);
        const right = (visitor.right as AstExpression).accept(this);

        return ts.factory.createBinaryExpression(
            left, expr, right
        )

    }

    visitCall(visitor: CallAST) {
    }

    visitIdentifier(expr: Identifier) {
        return ts.factory.createIdentifier(expr.name);
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

    visitUnary(visitor: Unary) {
    }

    visitArrayLiteral(expr: ArrayLiteralAST) {
    }

    visitAssignment(expr: AssignmentAST) {
    }

    visitConditional(expr: ConditionalAST) {
    }

    visitFalse(expr: FalseBooleanAST) {
    }

    visitGrouping(expr: GroupingAST) {
    }

    visitNonNullAssert(expr: NonNullAssertAST) {
    }

    visitNull(expr: NullAST) {
    }

    visitObjectLiteral(expr: ObjectLiteralAST) {
    }

    visitPipe(expr: BindingPipeAST) {
    }

    visitPropertyRead(expr: PropertyReadAST) {
    }

    visitPropertyWrite(expr: PropertyWriteAST) {
    }

    visitSafeCall(expr: SafeCallAST) {
    }

    visitSafePropertyRead(expr: SafePropertyReadAST) {
    }

    visitThis(expr: ThisAST) {
    }

    visitTrue(expr: TrueBooleanAST) {
    }

    visitUndefined(expr: UndefinedAST) {
    }


}
