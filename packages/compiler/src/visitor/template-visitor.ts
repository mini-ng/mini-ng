import {AstVisitor, Identifier, Literal, Sequence, Unary} from "../html_parser/ast/ast-impl";
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

    visitBinary(visitor: BinaryAST) {
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
