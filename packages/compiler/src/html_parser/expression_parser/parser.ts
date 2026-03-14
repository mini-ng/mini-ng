import {Token, TokenType} from "./tokens";
import {
    AST,
    BinaryAST, BindingPipeAST, CallAST,
    // ConditionalAst,
    IdentifierAST,
    LiteralAST,
    LiteralAstType, PropertyReadAST,
    SequenceAST,
    // UnaryAst
} from "../ast/ast";

// recursive descent parser
// Binary
//  |
//  v
// Literal, Identifier

export class HTMLExpressionParser {

    tokens: Token[];
    index = 0;

    constructor(tokens: Token[]) {
        this.tokens = tokens;
    }

    start(): AST[] {
        const expressions: AST[] = [];

        while (!this.isAtEnd()) {
            expressions.push(this.parseExpression());
        }

        return expressions;
    }

    parseExpression(): AST {
        return this.parseSequence();
    }

    // a(), b(), c()
    parseSequence(): SequenceAST {

        const expressions: AST[] = [];

        expressions.push(this.parsePipe());

        while (this.match(TokenType.COMMA)) {
            expressions.push(this.parsePipe());
        }

        return {
            type: "Sequence",
            expressions
        };
    }

    // a ? b : c
    parseConditional(): AST {

        let expr = this.parseAdditive();

        if (this.match(TokenType.TERNARY)) {

            const consequent = this.parseExpression();

            this.consumeType(TokenType.COLON, "Expected ':'");

            const alternate = this.parseExpression();

            expr = {
                type: "Conditional",
                test: expr,
                consequent,
                alternate
            };
        }

        return expr;
    }

    // + -
    parseAdditive(): AST {

        let expr = this.parseMultiplicative();

        while (
            this.check(TokenType.ADD) ||
            this.check(TokenType.SUB)
            ) {

            const operator = this.peek().value;
            this.advance();

            const right = this.parseMultiplicative();

            expr = {
                type: "Binary",
                operator,
                left: expr,
                right
            };
        }

        return expr;
    }

    // * /
    parseMultiplicative(): AST {

        let expr = this.parseUnary();

        while (
            this.check(TokenType.MUL) ||
            this.check(TokenType.DIV)
            ) {

            const operator = this.peek().value;
            this.advance();

            const right = this.parseUnary();

            expr = {
                type: "Binary",
                operator,
                left: expr,
                right
            };
        }

        return expr;
    }

    // | pipe
    parsePipe(): AST {

        let expr = this.parseConditional();

        while (this.match(TokenType.PIPE)) {

            const name = this.peek().value;
            this.consumeType(TokenType.IDENTIFIER, "Expected pipe name");

            const args: AST[] = [];

            while (this.match(TokenType.COLON)) {
                args.push(this.parseExpression());
            }

            expr = {
                type: "Pipe",
                name,
                expression: expr,
                args
            };
        }

        return expr;
    }

    parseUnary(): AST {

        if (
            this.check(TokenType.ADD) ||
            this.check(TokenType.SUB)
        ) {

            const operator = this.peek().value;
            this.advance();

            const argument = this.parseUnary();

            return {
                type: "Unary",
                operator,
                argument
            };
        }

        return this.parseLHS();
    }

    parseLHS(): AST {

        let expr = this.parsePrimary();

        while (true) {

            // call
            // e.g: call(45, 90)
            if (this.match(TokenType.LEFT_PAREN)) {

                const args: AST[] = [];

                if (!this.check(TokenType.RIGHT_PAREN)) {
                    do {
                        args.push(this.parseExpression());
                    } while (this.match(TokenType.COMMA));
                }

                this.consumeType(TokenType.RIGHT_PAREN, "Expected ')'");

                expr = {
                    type: "Call",
                    callee: expr,
                    args
                };
            }

            // property access
            // e.g: user.age
            else if (this.match(TokenType.DOT)) {

                const name = this.peek().value;

                this.consumeType(
                    TokenType.IDENTIFIER,
                    "Expected property name"
                );

                expr = {
                    type: "PropertyRead",
                    receiver: expr,
                    key: name,
                    computed: false
                };
            }

            // computed access
            // e.g: user['age']
            else if (this.match(TokenType.LEFT_SQUARE_BRACKET)) {

                const key = this.parseExpression();

                this.consumeType(
                    TokenType.RIGHT_SQUARE_BRACKET,
                    "Expected ']'"
                );

                expr = {
                    type: "PropertyRead",
                    receiver: expr,
                    key,
                    computed: true
                };
            }

            else {
                break;
            }
        }

        return expr;
    }

    parsePrimary(): AST {

        const token = this.peek();

        if (this.match(TokenType.IDENTIFIER)) {
            return {
                type: "Identifier",
                name: token.value
            };
        }

        if (this.match(TokenType.STRING)) {
            return {
                type: "Literal",
                valueType: LiteralAstType.STRING,
                value: token.value
            };
        }

        if (this.match(TokenType.NUMBER)) {
            return {
                type: "Literal",
                valueType: LiteralAstType.NUMBER,
                value: token.value
            };
        }

        if (this.match(TokenType.BOOL)) {
            return {
                type: "Literal",
                valueType: LiteralAstType.BOOLEAN,
                value: token.value
            };
        }

        if (this.match(TokenType.LEFT_PAREN)) {

            const expression = this.parseExpression();

            this.consumeType(TokenType.RIGHT_PAREN, "Expected ')'");

            return {
                type: "Grouping",
                expression
            };
        }

        throw new Error("Expected expression.");
    }

    match(type: TokenType): boolean {

        if (this.check(type)) {
            this.advance();
            return true;
        }

        return false;
    }

    check(type: TokenType): boolean {

        if (this.isAtEnd()) return false;

        return this.peek().token === type;
    }

    advance() {
        if (!this.isAtEnd()) this.index++;
    }

    consumeType(type: TokenType, errorMsg: string) {

        if (this.check(type)) {
            this.advance();
            return;
        }

        throw new Error(errorMsg);
    }

    peek(): Token {
        return this.tokens[this.index];
    }

    isAtEnd(): boolean {
        return this.index >= this.tokens.length;
    }
}
