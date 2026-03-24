import {Token, TokenType} from "./tokens";
import {AST, LiteralAstType} from "../ast/ast";
import {
    ArrayLiteral,
    AstExpression,
    Binary,
    BindingPipe,
    Call,
    Conditional,
    False,
    Grouping,
    Identifier,
    Literal,
    PropertyRead,
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

    public static instance(tokens: Token[]) {

        return (new HTMLExpressionParser(tokens))

    }

    start(): AstExpression {

        return this.parseExpression()
    }

    parseExpression(): AstExpression {
        return this.parsePipe();
    }

    // x, y
    parseComma() {

        let expr = this.parseSpread();

        while (this.match(TokenType.COMMA)) {
            const right = this.parseAssignment();
            expr = new Comma(expr, right);
        }

        return expr;
    }

    parseSpread() {

        if (this.check(TokenType.SPREAD)) {
            this.advance();

            const right = this.parseComma()

            return right
        }

        return this.parseYield()

    }

    parseYield() {

        if (this.match(TokenType.YIELD)) {
            let delegate = false;

            if (this.match(TokenType.STAR)) {
                delegate = true;
            }

            const argument = this.parseAssignment();
            return new YieldExpression(argument, delegate);
        }

        return this.parseArrow();
    }

    parseArrow() {
        return this.parseNullishCoalescingAssignment()
    }

    // x ? y : z
    parseConditional(): AstExpression {

        let expr = this.parseNullishCoalescingOperator();

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

    // x ??= y
    parseNullishCoalescingAssignment() {
        let expr = this.parseLogicalORAssignment();

        if (this.match(TokenType.NULLISH_COALESCING_ASSIGN)) {
            const token = this.previous()
            const right = this.parseComma();
            expr = this.createBinary(token, expr, right);
        }

        return expr;
    }

    // x ||= y
    parseLogicalORAssignment() {
        let expr = this.parseLogicalANDAssignment();

        if (this.match(TokenType.LOGICAL_OR_ASSIGN)) {
            const token = this.previous()
            const right = this.parseComma();
            expr = this.createBinary(token, expr, right);
        }

        return expr;

    }

    // x &&= y
    parseLogicalANDAssignment() {
        let expr = this.parseBitwiseORAssignment();

        if (this.match(TokenType.LOGICAL_AND_ASSIGN)) {
            const token = this.previous()
            const right = this.parseComma();
            expr = this.createBinary(token, expr, right);
        }

        return expr;

    }

    // x |= y
    parseBitwiseORAssignment() {
        let expr = this.parseBitwiseXORAssignment();

        if (this.match(TokenType.BITWISE_OR_ASSIGN)) {
            const token = this.previous()
            const right = this.parseComma();
            expr = this.createBinary(token, expr, right);
        }

        return expr;

    }

    // x ^= y
    parseBitwiseXORAssignment() {
        let expr = this.parseBitwiseANDAssignment();

        if (this.match(TokenType.BITWISE_XOR_ASSIGN)) {
            const token = this.previous()
            const right = this.parseComma();
            expr = this.createBinary(token, expr, right);
        }

        return expr;

    }

    // x &= y
    parseBitwiseANDAssignment() {
        let expr = this.parseUnsignedRightShiftAssignment();

        if (this.match(TokenType.BITWISE_AND_ASSIGN)) {
            const token = this.previous()
            const right = this.parseComma();
            expr = this.createBinary(token, expr, right);
        }

        return expr;

    }

    // x >>>= y
    parseUnsignedRightShiftAssignment() {
        let expr = this.parseRightShiftAssignment();

        if (this.match(TokenType.UnsignedRightShiftAssignment)) {
            const token = this.previous()
            const right = this.parseComma();
            expr = this.createBinary(token, expr, right);
        }

        return expr;

    }

    // x >>= y
    parseRightShiftAssignment() {
        let expr = this.parseLeftShiftAssignment();

        if (this.match(TokenType.RightShiftAssignment)) {
            const token = this.previous()
            const right = this.parseComma();
            expr = this.createBinary(token, expr, right);
        }

        return expr;

    }

    // x <<= y
    parseLeftShiftAssignment() {
        let expr = this.parseRemainderAssignment();

        if (this.match(TokenType.LeftShiftAssignment)) {
            const token = this.previous()
            const right = this.parseComma();
            expr = this.createBinary(token, expr, right);
        }

        return expr;

    }

    // x %= y
    parseRemainderAssignment() {
        let expr = this.parseDivisionAssignment();

        if (this.match(TokenType.RemainderAssignment)) {
            const token = this.previous()
            const right = this.parseComma();
            expr = this.createBinary(token, expr, right);
        }

        return expr;

    }

    // x /= y
    parseDivisionAssignment() {
        let expr = this.parseMultiplicationAssignment();

        if (this.match(TokenType.DivisionAssignment)) {
            const token = this.previous()
            const right = this.parseComma();
            expr = this.createBinary(token, expr, right);
        }

        return expr;

    }

    // x *= y
    parseMultiplicationAssignment() {
        let expr = this.parseExponentiationAssignment();

        if (this.match(TokenType.MultiplicationAssignment)) {
            const token = this.previous()
            const right = this.parseComma();
            expr = this.createBinary(token, expr, right);
        }

        return expr;

    }

    // x **= y
    parseExponentiationAssignment() {
        let expr = this.parseSubtractionAssignment();

        if (this.match(TokenType.ExponentiationAssignment)) {
            const token = this.previous()
            const right = this.parseComma();
            expr = this.createBinary(token, expr, right);
        }

        return expr;

    }

    // x -= y
    parseSubtractionAssignment() {
        let expr = this.parseAdditionAssignment();

        if (this.match(TokenType.SubtractionAssignment)) {
            const token = this.previous()
            const right = this.parseComma();
            expr = this.createBinary(token, expr, right);
        }

        return expr;

    }

    // x += y
    parseAdditionAssignment() {
        let expr = this.parseLogicalANDAssignment();

        if (this.match(TokenType.AdditionAssignment)) {
            const token = this.previous()
            const right = this.parseComma();
            expr = this.createBinary(token, expr, right);
        }

        return expr;

    }

    // x = y
    parseAssignment() {
        let expr = this.parseConditional();

        if (this.match(TokenType.Assignment)) {
            const token = this.previous()
            const right = this.parseComma();
            expr = this.createBinary(token, expr, right);
        }

        return expr;

    }

    // x ?? y
    parseNullishCoalescingOperator() {

        let expr = this.parseLogicalOr();

        if (this.match(TokenType.NULLISH_COALESCING)) {
            const token = this.previous()
            const right = this.parseComma();
            expr = this.createBinary(token, expr, right);
        }

        return expr;

    }

    // x || y
    parseLogicalOr() {
        let expr = this.parseLogicalAnd();

        while (this.match(TokenType.LOGICAL_OR)) {
            const token = this.previous()
            const right = this.parseLogicalAnd();
            expr = this.createBinary(token, expr, right);
        }

        return expr;
    }

    // x && y
    parseLogicalAnd() {

        let expr = this.parseBitwiseOr();

        while (this.match(TokenType.LOGICAL_AND)) {
            const op = this.previous();
            const right = this.parseBitwiseOr();

            expr = this.createBinary(op, expr, right);
        }
        return expr;
    }

    // x | y
    parseBitwiseOr() {
        let expr = this.parseBitwiseXor();
        while (this.match(TokenType.PIPE)) {
            const op = this.previous();
            const right = this.parseBitwiseOr();

            expr = this.createBinary(op, expr, right);
        }
        return expr;
    }

    // x ^ y
    parseBitwiseXor() {
        let expr = this.parseBitwiseAnd();
        while (this.match(TokenType.BITWISE_XOR)) {
            const op = this.previous();
            const right = this.parseBitwiseOr();

            expr = this.createBinary(op, expr, right);
        }
        return expr;
    }

    // x & y
    parseBitwiseAnd() {
        let expr = this.parseStrictEquality();
        while (this.match(TokenType.AND)) {
            const op = this.previous();
            const right = this.parseBitwiseOr();

            expr = this.createBinary(op, expr, right);
        }
        return expr;
    }

    // x === y
    parseStrictEquality() {
        let expr = this.parseInequality();

        while (this.match(TokenType.STRICT_EQUAL)) {
            const op = this.previous();
            const right = this.parseBitwiseOr();

            expr = this.createBinary(op, expr, right);
        }

        return expr;
    }

    // x !== y
    parseInequality() {
        let expr = this.parseEquality();

        while (this.match(TokenType.STRICT_NOTEQUAL)) {
            const op = this.previous();
            const right = this.parseBitwiseOr();

            expr = this.createBinary(op, expr, right);
        }

        return expr;

    }

    // x == y
    parseEquality() {
        let expr = this.parseInstanceOf();

        while (this.match(TokenType.EQUAL)) {
            const op = this.previous();
            const right = this.parseBitwiseOr();

            expr = this.createBinary(op, expr, right);
        }

        return expr;
    }

    // x instanceof y
    parseInstanceOf() {
        let expr = this.parseIn();

        while (this.match(TokenType.EQUAL)) {
            const op = this.previous();
            const right = this.parseBitwiseOr();

            expr = this.createBinary(op, expr, right);
        }

        return expr;

    }

    // x in y
    parseIn() {

    }

    // x >= y
    parseGreaterThanOrEqual() {

    }

    // x > y
    parseGreaterThan() {}

    // x <= y
    parseLessThanOrEqual() {}

    // x < y
    parseLessThan() {}

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

        // [ array literal ]
        if (this.match(TokenType.LEFT_SQUARE_BRACKET)) {

            const token = this.previous();
            let elements: AstExpression[] = [];

            if (!this.check(TokenType.RIGHT_SQUARE_BRACKET)) {
                do {
                    if (this.match(TokenType.SPREAD)) {
                        elements.push(this.parseSpread());
                    } else {
                        elements.push(this.parseAssignment());
                    }
                } while (this.match(TokenType.COMMA));
            }
            this.consumeType(TokenType.RIGHT_SQUARE_BRACKET,
                "Expected ']' at line: ");

            const arrayLiteral = new ArrayLiteral()
            return arrayLiteral;

            // return make_unique<ArrayLiteralExpression>(token, std::move(elements));

        }

        // { object literal }
        if (this.match(TokenType.LBRACE)) {
            const token = this.previous();
            const props: AstExpression[] = [];
            if (!this.check(TokenType.RBRACE)) {
                do {

                    let key;
                    if (this.match(TokenType.SPREAD)) {
                        props.push({ key, this.parseSpread() });
                    } else {
                        // key in object-literal can be a string
                        if (this.peek().type == TokenType.STRING) {
                            key = this.consume(TokenType.STRING,
                                "Expected property key at line: " + to_string(peek().line));
                        } else if (this.peek().type == TokenType.IDENTIFIER) {
                            key = this.consume(TokenType.IDENTIFIER,
                                "Expected property key at line: " + to_string(peek().line));
                        } else {
                            throw ("Expected property key at line: " + to_string(peek().line));
                        }

                        this.consume(TokenType.COLON,
                            "Expected ':' after property key at line: " + to_string(peek().line));
                        const value = this.parseAssignment();
                        props.push({ key, std::move(value) });

                    }

                } while (this.match(TokenType.COMMA));
            }
            this.consume(TokenType.RBRACE,
                "Expected '}' at line: " + to_string(peek().line));
            return make_unique<ObjectLiteralExpression>(token, std::move(props));
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

    consume(type: TokenType, errorMsg: string) {
        this.consumeType(type, errorMsg)
    }

    previous() {
        return this.tokens[this.index - 1];
    }

    peek(): Token {
        return this.tokens[this.index];
    }

    isAtEnd(): boolean {
        return this.index >= this.tokens.length;
    }

    createBinary(token: Token, left: AstExpression, right: AstExpression): AstExpression {
        const binary = new Binary();
        binary.type = "Binary"
        binary.operator = token.value;
        binary.left = left
        binary.right = right

        return binary
    }
}
