import {Token, TokenType} from "./tokens";
import {
    AST,
    BinaryAST,
    ConditionalAst,
    IdentifierAST,
    LiteralAST,
    LiteralAstType,
    SequenceAST,
    UnaryAst
} from "../ast/ast";

// recursive descent parser
// Binary
//  |
//  v
// Literal, Identifier

export class HTMLExpressionParser {

    tokens: Token[];
    index: number = 0

    expressions: AST[]

    start() {

        while (!this.isAtEnd()) {
            this.expressions.push(this.parseExpression())
        }

        return this.expressions;

    }

    parseExpression() {
        return this.parseSequence()
    }

    // ((2 + 2), (call()))
    // [BinaryAst, CallAst]
    parseSequence() {
        // this is an array of expressions
        const exprs = []
        exprs.push(this.parseConditional())

        while (this.match(TokenType.COMMA)) {
            exprs.push(this.parseConditional())
        }

        return { exprs } as SequenceAST

    }

    parseConditional() {

        let expr: AST = this.parseBinary();

        if (this.match(TokenType.TERNARY)) {
            const thenExpr = this.parseExpression();
            this.consumeType(TokenType.COLON, "Expected ':' in conditional expression");
            const elseExpr = this.parseExpression();
            expr = { xpr: expr, then: thenExpr, else: elseExpr } as ConditionalAst
        }
        return expr;

    }

    parseBinary() {

        const lhs = this.parseUnary();

        while(this.matchArray([TokenType.SUB, TokenType.ADD, TokenType.MUL, TokenType.DIV])) {

            const rhs = this.parseExpression()
            const { value} = this.peek()

            return {
                operator: value,
                left: lhs,
                right: rhs,
            } as BinaryAST;

        }

        return lhs;

    }

    parseUnary() {

        // if peek is - or + or !
        if (this.match(TokenType.ADD) || this.match(TokenType.SUB)) {
            const expr = this.parseUnary();
            return {
                op: this.peek().value,
                expr
            } as UnaryAst
        }

        return this.parsePrimary()

    }

    parsePrimary() {

        const token = this.peek();

        if (this.match(TokenType.IDENTIFIER)) {
            return {value: token.value} as IdentifierAST
        }

        if (this.match(TokenType.STRING)) {
            return {type: LiteralAstType.STRING, value: token.value} as LiteralAST
        }

        if (this.match(TokenType.NUMBER)) {
            return {type: LiteralAstType.NUMBER, value: token.value} as LiteralAST
        }

        if (this.match(TokenType.BOOL)) {
            return {type: LiteralAstType.BOOLEAN, value: token.value} as LiteralAST
        }

        if (this.match(TokenType.LEFT_PAREN)) {

            let expr: AST = null;

            if (this.peek().token === TokenType.RIGHT_PAREN) {
                this.consumeType(TokenType.RIGHT_PAREN, "Expected ')' at line: ")
            } else {
                expr = this.parseExpression()
            }

            return expr
        }
    }

    match(type: TokenType) {
        if (this.check(type)) {
            this.advance();
            return true;
        }
        return false;
    }

    check(type: TokenType) {

        if (this.isAtEnd()) return false;

        const current = this.peek();

        if (current.token === type) {
            return true
        }

        return false;
    }

    advance() {
        this.index++
    }

    consume() {
        this.index++
    }

    consumeType(type: TokenType, errorMsg: string) {
        if (this.match(type)) {
            this.advance();
        } else {
            throw errorMsg
        }
    }

    peek() {
        return this.tokens[this.index]
    }

    isAtEnd() {
        return this.index >= this.tokens.length
    }

    private matchArray(param: TokenType[]) {
        for (let i = 0; i < param.length; i++) {
            const token = param[i];
            if (this.check(token)) {
                this.advance();
                return true
            }
        }
        return false;
    }
}
