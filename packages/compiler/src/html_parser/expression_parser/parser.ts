import {Token, TokenType} from "./tokens";
import {
    AST,
    LiteralAstType
} from "../ast/ast";
import {
    AstExpression,
    Binary,
    BindingPipe,
    Call,
    Conditional, False, Grouping,
    Identifier,
    Literal, PropertyRead,
    Sequence,
    True,
    Unary
} from "../ast/ast-impl";

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

    private static _instance: HTMLExpressionParser;

    public static instance(tokens: Token[]) {

        return (HTMLExpressionParser._instance = new HTMLExpressionParser(tokens))

    }

    start(): AstExpression {

        return this.parseExpression()
    }

    parseExpression(): AstExpression {
        return this.parsePipe();
    }

    // a(), b(), c()
    parseSequence(): AstExpression {

        const expressions: AST[] = [];

        expressions.push(this.parsePipe());

        while (this.match(TokenType.COMMA)) {
            expressions.push(this.parsePipe());
        }

        const seq = new Sequence()
        seq.type = "Sequence";
        seq.expressions = expressions

        return seq;
    }

    // a ? b : c
    parseConditional(): AstExpression {

        let expr = this.parseAdditive();

        if (this.match(TokenType.TERNARY)) {

            const consequent = this.parseExpression();

            this.consumeType(TokenType.COLON, "Expected ':'");

            const alternate = this.parseExpression();

            const conditional = new Conditional();
            conditional.alternate = alternate;
            conditional.consequent = consequent;
            conditional.test = expr

            expr = conditional;

        }

        return expr;
    }

    // + -
    parseAdditive(): AstExpression {

        let expr = this.parseMultiplicative();

        while (
            this.check(TokenType.ADD) ||
            this.check(TokenType.SUB)
            ) {

            const operator = this.peek().value;
            this.advance();

            const right = this.parseMultiplicative();

            const bin = new Binary();
            bin.type = "Binary"
            bin.operator = operator;
            bin.left = expr
            bin.right = right

            expr = bin;
        }

        return expr;
    }

    // * /
    parseMultiplicative(): AstExpression {

        let expr = this.parseUnary();

        while (
            this.check(TokenType.MUL) ||
            this.check(TokenType.DIV)
            ) {

            const operator = this.peek().value;
            this.advance();

            const right = this.parseUnary();

            const bin = new Binary();
            bin.type = "Binary"
            bin.operator = operator;
            bin.left = expr
            bin.right = right

            expr = bin;
        }

        return expr;
    }

    parseLogicalOr() {}
    parseLogicalAnd() {}
    parseEquality() {}
    parseComparison() {}

    // | pipe
    parsePipe(): AstExpression {

        let expr = this.parseConditional();

        while (this.match(TokenType.PIPE)) {

            const name = this.peek().value;
            this.consumeType(TokenType.IDENTIFIER, "Expected pipe name");

            const args: AST[] = [];

            while (this.match(TokenType.COLON)) {
                args.push(this.parseExpression());
            }

            const pipe = new BindingPipe();
            pipe.name = name;
            pipe.type = "Pipe"
            pipe.expression = expr
            pipe.args = args


            expr = pipe;
        }

        return expr;
    }

    parseUnary(): AstExpression {

        if (
            this.check(TokenType.ADD) ||
            this.check(TokenType.SUB)
        ) {

            const operator = this.peek().value;
            this.advance();

            const argument = this.parseUnary();

            const unary = new Unary()
            unary.operator = operator;
            unary.argument = argument;

            return unary;
        }

        return this.parseLHS();
    }

    parseLHS(): AstExpression {

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

                const call = new Call()
                call.callee = expr;
                call.args = args

                expr = call;

            }

            // property access
            // e.g: user.age
            else if (this.match(TokenType.DOT)) {

                const name = this.peek().value;

                this.consumeType(
                    TokenType.IDENTIFIER,
                    "Expected property name"
                );

                const propertyRead = new PropertyRead()
                propertyRead.type = "PropertyRead";
                propertyRead.key = name;
                propertyRead.computed = false
                propertyRead.receiver = expr

                expr = propertyRead;
            }

            // computed access
            // e.g: user['age']
            else if (this.match(TokenType.LEFT_SQUARE_BRACKET)) {

                const key = this.parseExpression();

                this.consumeType(
                    TokenType.RIGHT_SQUARE_BRACKET,
                    "Expected ']'"
                );

                const propertyRead = new PropertyRead()
                propertyRead.type = "PropertyRead";
                propertyRead.key = key;
                propertyRead.computed = true
                propertyRead.receiver = expr

                expr = propertyRead;
            }

            else {
                break;
            }
        }

        return expr;
    }

    parsePrimary(): AstExpression {

        const token = this.peek();

        if (this.match(TokenType.IDENTIFIER)) {
            const identifier = new Identifier();
            identifier.name = token.value;
            return identifier
        }

        if (this.match(TokenType.STRING)) {
            const literal = new Literal()
            literal.value = token.value;
            literal.valueType = LiteralAstType.STRING;

            return literal;
        }

        if (this.match(TokenType.NUMBER)) {
            const literal = new Literal()
            literal.value = token.value;
            literal.valueType = LiteralAstType.NUMBER;
            return literal;
        }

        if (this.match(TokenType.TRUE)) {
            return new True();
        }

        if (this.match(TokenType.FALSE)) {
            return new False();
        }

        if (this.match(TokenType.LEFT_PAREN)) {

            const expression = this.parseExpression();

            this.consumeType(TokenType.RIGHT_PAREN, "Expected ')'");

            const grouping = new Grouping()
            grouping.type = "Grouping"
            grouping.expression = expression;

            return grouping;
        }

        throw new Error("Expected expression." + this.peek().value.toString());
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
