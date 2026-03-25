import {Token, TokenType} from "./tokens";
import {AST, LiteralAstType} from "../ast/ast";
import {
    ArrayLiteral,
    AstExpression,
    Binary,
    BindingPipe,
    Call,
    Comma,
    Conditional,
    False,
    Grouping,
    Identifier,
    Literal, New,
    ObjectLiteral, ObjectProperty,
    PostfixUpdate,
    PrefixUnary,
    PrefixUpdate, PropertyRead, SafeCall, SafePropertyRead,
    True,
    YieldExpression
} from "../ast/ast-impl";
import {keywords} from "./expr_tokenizer";

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

    // x, y
    // Associativity: left-to-right
    parseComma() {

        let expr = this.parseYield();

        while (this.match(TokenType.COMMA)) {
            const right = this.parseYield();
            expr = new Comma(expr, right);
        }

        return expr;
    }

    parseSpread() {

        let expr: AstExpression

        if (this.match(TokenType.SPREAD)) {
            expr = this.parseExpression();
        }

        return expr

    }

    // Associativity: n/a
    parseYield() {

        if (this.match(TokenType.YIELD)) {
            let delegate = false;

            if (this.match(TokenType.STAR)) {
                delegate = true;
            }

            const argument = this.parseExpression();
            return new YieldExpression(argument, delegate);
        }

        return this.parseArrow();
    }

    // TODO: implement this
    parseArrow() {
        return this.parseNullishCoalescingAssignment()
    }

    // x ? y : z
    // right-to-left
    parseConditional(): AstExpression {

        let expr = this.parseNullishCoalescingOperator();

        if (this.match(TokenType.TERNARY)) {

            const consequent = this.parseConditional();

            this.consumeType(TokenType.COLON, "Expected ':'");

            const alternate = this.parseConditional();

            const conditional = new Conditional();
            conditional.alternate = alternate;
            conditional.consequent = consequent;
            conditional.test = expr

            expr = conditional;

        }

        return expr;
    }

    // x ??= y
    // right-to-left
    parseNullishCoalescingAssignment() {
        let expr = this.parseLogicalORAssignment();

        if (this.match(TokenType.NULLISH_COALESCING_ASSIGN)) {
            const token = this.previous()
            const right = this.parseNullishCoalescingAssignment();
            expr = this.createBinary(token, expr, right);
        }

        return expr;
    }

    // x ||= y
    parseLogicalORAssignment() {
        let expr = this.parseLogicalANDAssignment();

        if (this.match(TokenType.LOGICAL_OR_ASSIGN)) {
            const token = this.previous()
            const right = this.parseLogicalORAssignment();
            expr = this.createBinary(token, expr, right);
        }

        return expr;

    }

    // x &&= y
    parseLogicalANDAssignment() {
        let expr = this.parseBitwiseORAssignment();

        if (this.match(TokenType.LOGICAL_AND_ASSIGN)) {
            const token = this.previous()
            const right = this.parseLogicalANDAssignment();
            expr = this.createBinary(token, expr, right);
        }

        return expr;

    }

    // x |= y
    parseBitwiseORAssignment() {
        let expr = this.parseBitwiseXORAssignment();

        if (this.match(TokenType.BITWISE_OR_ASSIGN)) {
            const token = this.previous()
            const right = this.parseBitwiseORAssignment();
            expr = this.createBinary(token, expr, right);
        }

        return expr;

    }

    // x ^= y
    parseBitwiseXORAssignment() {
        let expr = this.parseBitwiseANDAssignment();

        if (this.match(TokenType.BITWISE_XOR_ASSIGN)) {
            const token = this.previous()
            const right = this.parseBitwiseXORAssignment();
            expr = this.createBinary(token, expr, right);
        }

        return expr;

    }

    // x &= y
    parseBitwiseANDAssignment() {
        let expr = this.parseUnsignedRightShiftAssignment();

        if (this.match(TokenType.BITWISE_AND_ASSIGN)) {
            const token = this.previous()
            const right = this.parseBitwiseANDAssignment();
            expr = this.createBinary(token, expr, right);
        }

        return expr;

    }

    // x >>>= y
    parseUnsignedRightShiftAssignment() {
        let expr = this.parseRightShiftAssignment();

        if (this.match(TokenType.UnsignedRightShiftAssignment)) {
            const token = this.previous()
            const right = this.parseUnsignedRightShiftAssignment();
            expr = this.createBinary(token, expr, right);
        }

        return expr;

    }

    // x >>= y
    parseRightShiftAssignment() {
        let expr = this.parseLeftShiftAssignment();

        if (this.match(TokenType.RightShiftAssignment)) {
            const token = this.previous()
            const right = this.parseRightShiftAssignment();
            expr = this.createBinary(token, expr, right);
        }

        return expr;

    }

    // x <<= y
    parseLeftShiftAssignment() {
        let expr = this.parseRemainderAssignment();

        if (this.match(TokenType.LeftShiftAssignment)) {
            const token = this.previous()
            const right = this.parseLeftShiftAssignment();
            expr = this.createBinary(token, expr, right);
        }

        return expr;

    }

    // x %= y
    parseRemainderAssignment() {
        let expr = this.parseDivisionAssignment();

        if (this.match(TokenType.RemainderAssignment)) {
            const token = this.previous()
            const right = this.parseRemainderAssignment();
            expr = this.createBinary(token, expr, right);
        }

        return expr;

    }

    // x /= y
    parseDivisionAssignment() {
        let expr = this.parseMultiplicationAssignment();

        if (this.match(TokenType.DivisionAssignment)) {
            const token = this.previous()
            const right = this.parseDivisionAssignment();
            expr = this.createBinary(token, expr, right);
        }

        return expr;

    }

    // x *= y
    parseMultiplicationAssignment() {
        let expr = this.parseExponentiationAssignment();

        if (this.match(TokenType.MultiplicationAssignment)) {
            const token = this.previous()
            const right = this.parseMultiplicationAssignment();
            expr = this.createBinary(token, expr, right);
        }

        return expr;

    }

    // x **= y
    parseExponentiationAssignment() {
        let expr = this.parseSubtractionAssignment();

        if (this.match(TokenType.ExponentiationAssignment)) {
            const token = this.previous()
            const right = this.parseExponentiationAssignment();
            expr = this.createBinary(token, expr, right);
        }

        return expr;

    }

    // x -= y
    parseSubtractionAssignment() {
        let expr = this.parseAdditionAssignment();

        if (this.match(TokenType.SubtractionAssignment)) {
            const token = this.previous()
            const right = this.parseSubtractionAssignment();
            expr = this.createBinary(token, expr, right);
        }

        return expr;

    }

    // x += y
    parseAdditionAssignment() {
        let expr = this.parseAssignment();

        if (this.match(TokenType.AdditionAssignment)) {
            const token = this.previous()
            const right = this.parseAdditionAssignment();
            expr = this.createBinary(token, expr, right);
        }

        return expr;

    }

    // x = y
    parseAssignment() {
        let expr = this.parseConditional();

        if (this.match(TokenType.Assignment)) {
            const token = this.previous()
            const right = this.parseAssignment();
            expr = this.createBinary(token, expr, right);
        }

        return expr;

    }

    // x ?? y
    // left-to-right
    parseNullishCoalescingOperator() {

        let expr = this.parseLogicalOr();

        if (this.match(TokenType.NULLISH_COALESCING)) {
            const token = this.previous()
            const right = this.parseLogicalOr();
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
            const right = this.parseBitwiseXor();

            expr = this.createBinary(op, expr, right);
        }
        return expr;
    }

    // x ^ y
    parseBitwiseXor() {
        let expr = this.parseBitwiseAnd();
        while (this.match(TokenType.BITWISE_XOR)) {
            const op = this.previous();
            const right = this.parseBitwiseAnd();

            expr = this.createBinary(op, expr, right);
        }
        return expr;
    }

    // x & y
    parseBitwiseAnd() {
        let expr = this.parseStrictEquality();
        while (this.match(TokenType.AND)) {
            const op = this.previous();
            const right = this.parseStrictEquality();

            expr = this.createBinary(op, expr, right);
        }
        return expr;
    }

    // x === y
    parseStrictEquality() {
        let expr = this.parseInequality();

        while (this.match(TokenType.STRICT_EQUAL)) {
            const op = this.previous();
            const right = this.parseInequality();

            expr = this.createBinary(op, expr, right);
        }

        return expr;
    }

    // x !== y
    parseInequality() {
        let expr = this.parseEquality();

        while (this.match(TokenType.STRICT_NOTEQUAL)) {
            const op = this.previous();
            const right = this.parseEquality();

            expr = this.createBinary(op, expr, right);
        }

        return expr;

    }

    // x == y
    parseEquality() {
        let expr = this.parseInstanceOf();

        while (this.match(TokenType.EQUAL)) {
            const op = this.previous();
            const right = this.parseInstanceOf();

            expr = this.createBinary(op, expr, right);
        }

        return expr;
    }

    // x instanceof y
    parseInstanceOf() {
        let expr = this.parseIn();

        while (this.matchKeyword(keywords.instanceof)) {
            const op = this.previous();
            const right = this.parseIn();

            expr = this.createBinary(op, expr, right);
        }

        return expr;

    }

    // x in y
    parseIn() {
        let expr = this.parseGreaterThanOrEqual();

        while (this.matchKeyword(keywords.in)) {
            const op = this.previous();
            const right = this.parseGreaterThanOrEqual();

            expr = this.createBinary(op, expr, right);
        }

        return expr;

    }

    // x >= y
    parseGreaterThanOrEqual() {
        let expr = this.parseGreaterThan();

        while (this.match(TokenType.GREATER_EQUAL)) {
            const op = this.previous();
            const right = this.parseGreaterThan();

            expr = this.createBinary(op, expr, right);
        }

        return expr;

    }

    // x > y
    parseGreaterThan() {
        let expr = this.parseLessThanOrEqual();

        while (this.match(TokenType.GREATER_THAN)) {
            const op = this.previous();
            const right = this.parseLessThanOrEqual();

            expr = this.createBinary(op, expr, right);
        }

        return expr;

    }

    // x <= y
    parseLessThanOrEqual() {
        let expr = this.parseLessThan();

        while (this.match(TokenType.LESS_EQUAL)) {
            const op = this.previous();
            const right = this.parseLessThan();

            expr = this.createBinary(op, expr, right);
        }

        return expr;

    }

    // x < y
    parseLessThan() {
        let expr = this.parseUnsignedRightShift();

        while (this.match(TokenType.LESS_THAN)) {
            const op = this.previous();
            const right = this.parseUnsignedRightShift();

            expr = this.createBinary(op, expr, right);
        }

        return expr;

    }

    // x >>> y
    parseUnsignedRightShift() {
        let expr = this.parseRightShift();

        while (this.match(TokenType.BIT_SHR)) {
            const op = this.previous();
            const right = this.parseRightShift();

            expr = this.createBinary(op, expr, right);
        }

        return expr;
    }

    // x >> y
    parseRightShift() {
        let expr = this.parseLeftShift();

        while (this.match(TokenType.SHR)) {
            const op = this.previous();
            const right = this.parseLeftShift();

            expr = this.createBinary(op, expr, right);
        }

        return expr;

    }

    // x << y
    parseLeftShift() {
        let expr = this.parseSubtraction();

        while (this.match(TokenType.SHL)) {
            const op = this.previous();
            const right = this.parseSubtraction();

            expr = this.createBinary(op, expr, right);
        }

        return expr;

    }

    // -
    parseSubtraction() {
        let expr = this.parseAdditive();

        while (this.match(TokenType.SUB)) {
            const op = this.previous();
            const right = this.parseAdditive();

            expr = this.createBinary(op, expr, right);
        }

        return expr;
    }

    // +
    parseAdditive(): AstExpression {

        let expr = this.parseRemainder();

        while (this.check(TokenType.ADD)) {

            const operator = this.peek().value;
            this.advance();

            const right = this.parseRemainder();

            const bin = new Binary();
            bin.type = "Binary"
            bin.operator = operator;
            bin.left = expr
            bin.right = right

            expr = bin;
        }

        return expr;
    }

    // x % y
    parseRemainder() {
        let expr = this.parseDivision();

        while (this.match(TokenType.Remainder)) {
            const op = this.previous();
            const right = this.parseDivision();

            expr = this.createBinary(op, expr, right);
        }

        return expr;
    }

    parseDivision() {
        let expr = this.parseMultiplicative();

        while (this.match(TokenType.DIV)) {
            const op = this.previous();
            const right = this.parseMultiplicative();

            expr = this.createBinary(op, expr, right);
        }

        return expr;
    }

    // *
    parseMultiplicative(): AstExpression {

        let expr = this.parseExponentiation();

        while (
            this.check(TokenType.MUL)
            ) {

            const operator = this.peek().value;
            this.advance();

            const right = this.parseExponentiation();

            const bin = new Binary();
            bin.type = "Binary"
            bin.operator = operator;
            bin.left = expr
            bin.right = right

            expr = bin;
        }

        return expr;
    }

    // x ** y
    // right-to-left
    parseExponentiation() {
        let expr = this.parsePrefixOperators();

        if (this.match(TokenType.Exponentiation)) {
            const op = this.previous();
            const right = this.parseExponentiation();

            expr = this.createBinary(op, expr, right);
        }

        return expr;

    }

    // prefix operators
    // Associativity: n/a
    // Prefix increment
    // ++x	[6]
    // Prefix decrement
    // --x
    // Logical NOT
    // !x
    // Bitwise NOT
    // ~x
    // Unary plus
    // +x
    // Unary negation
    // -x
    // typeof x
    // void x
    // delete x	[7]
    // await x
    parsePrefixOperators() {

        if (this.matchAllKeywords(keywords.typeof, keywords.void, keywords.delete, keywords.await)) {
            return new PrefixUnary(this.previous(), this.parseExpression());
        }

        if (this.matchAll(TokenType.LOGICAL_NOT, TokenType.BITWISE_NOT, TokenType.ADD, TokenType.SUB)) {
            return new PrefixUnary(this.previous(), this.parseExpression());
        }

        if (this.matchAll(TokenType.Increment, TokenType.Decrement)) {
            return new PrefixUpdate(this.previous(), this.parseExpression());
        }

        return this.parsePostfixOperators();

    }

    // Associativity: n/a
    // Postfix increment
    // x++	[5]
    // Postfix decrement
    // x--
    parsePostfixOperators() {

        if (this.matchAll(TokenType.Increment, TokenType.Decrement)) {
            return new PostfixUpdate(this.previous(), this.parseExpression());
        }

        return this.parseNewWithoutArgs();

    }

    parseNewWithoutArgs() {

        if (this.matchKeyword(keywords.new)) {

            const ctor = this.parsePrimary();
            const args = this.parseArguments();

            return new New(ctor, args);
        }

        return this.parseLeftHandSide();

    }

    parseLeftHandSide(): AstExpression {

        let expr = this.parsePrimary();

        while (true) {

            // a.b
            if (this.match(TokenType.DOT)) {
                const prop = this.consumeIdentifier();
                expr = new PropertyRead(expr, prop.value);
            }

            // a?.b
            else if (this.match(TokenType.OPTIONAL_CHAINING)) {
                const prop = this.consumeIdentifier();
                expr = new SafePropertyRead(expr, prop.value);
            }

            // a[b]
            else if (this.match(TokenType.LEFT_SQUARE_BRACKET)) {
                const prop = this.parseExpression();
                this.consume(TokenType.RIGHT_SQUARE_BRACKET, "Expected ']'.");
                expr = new PropertyRead(expr, prop, true);
            }

            // a[b]?.c
            else if (this.match(TokenType.QUESTION_LEFT_SQUARE_BRACKET)) {
                const prop = this.parseExpression();
                this.consume(TokenType.RIGHT_SQUARE_BRACKET, "Expected ']'.");
                expr = new SafePropertyRead(expr, prop, true);
            }

            // a()
            else if (this.match(TokenType.LEFT_PAREN)) {
                const args = this.parseArguments();
                expr = new Call(expr, args);
            }

            // a?.()
            else if (this.match(TokenType.SAFE_CALL)) {
                const args = this.parseArguments();
                expr = new SafeCall(expr, args);
            } else {
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

            return new ArrayLiteral(elements)

        }

        // { object literal }
        if (this.match(TokenType.LBRACE)) {

            const token = this.previous();
            const props: ObjectProperty[] = [];

            if (!this.check(TokenType.RBRACE)) {
                do {

                    let key;
                    if (this.match(TokenType.SPREAD)) {
                        props.push({key, value: this.parseSpread()});
                    } else {
                        // key in object-literal can be a string
                        if (this.peek().token == TokenType.STRING) {
                            key = this.peek().value;
                            this.consume(TokenType.STRING,
                                "Expected property key at line: ");
                        } else if (this.peek().token == TokenType.IDENTIFIER) {
                            key = this.peek().value;
                            this.consume(TokenType.IDENTIFIER,
                                "Expected property key at line: ");
                        } else {
                            throw ("Expected property key at line: ");
                        }

                        this.consume(TokenType.COLON,
                            "Expected ':' after property key at line: ");
                        const value = this.parseAssignment();
                        props.push({key, value});

                    }

                } while (this.match(TokenType.COMMA));
            }
            this.consume(TokenType.RBRACE,
                "Expected '}' at line: ");
            return new ObjectLiteral(props);
        }

        console.log(this.tokens, this.index)
        throw new Error("Expected expression." + this.peek().value.toString());

    }

    match(type: TokenType): boolean {

        if (this.check(type)) {
            this.advance();
            return true;
        }

        return false;
    }

    matchKeyword(value: string) {
        if (this.check(TokenType.KEYWORD) && this.checkString(value)) {
            this.advance();
            return true;
        }
        return false;
    }

    matchAll(...tokens: TokenType[]) {
        for (const token of tokens) {
            if (this.match(token)) {
                return true;
            }
        }

        return false;
    }

    matchAllKeywords(...tokens: string[]) {
        for (const token of tokens) {
            if (this.matchString(token)) {
                return true;
            }
        }
        return false;
    }

    matchString(value: string) {
        if (this.checkString(value)) {
            this.advance();
            return true;
        }
        return false;
    }

    checkString(value: string) {
        if (this.isAtEnd()) return false;

        return this.peek().value === value;

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

    private consumeIdentifier() {
        const prop = this.peek();
        this.consume(TokenType.IDENTIFIER, "There is no identifier");
        return prop
    }

    private parseArguments() {

        const args = [];

        do {
            if (this.match(TokenType.SPREAD)) {
                args.push(this.parseSpread());
            } else {
                args.push(this.parseAssignment());
            }
        } while (this.match(TokenType.COMMA));

        return args;

    }
}
