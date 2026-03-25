import {Token, TokenType} from "./tokens";

const operators = [
    // Assignment
    "=", "+=", "-=", "*=", "/=", "%=", "**=", "<<=", ">>=", ">>>=",
    "&=", "^=", "|=", "&&=", "||=", "??=",

    // Arithmetic
    "+", "-", "*", "/", "%", "**", "++", "--",

    // Comparison
    "==", "!=", "===", "!==", ">", ">=", "<", "<=",

    // Logical
    "&&", "||", "!", "??",

    // Bitwise
    "&", "|", "^", "~", "<<", ">>", ">>>",

    // Other / Misc
    "typeof", "instanceof", "in", "void", "delete",
    "?", ":", ",", "...", ".", "?.", "[", "]", "(", ")", "{", "}"
];

export const keywords = {
    // Control flow
    if: "IF", else: "ELSE",
    switch: "SWITCH", case: "CASE", default: "DEFAULT",
    for: "FOR", while: "WHILE", do: "DO",
    break: "BREAK", continue: "CONTINUE",
    return: "RETURN", throw: "THROW",
    try: "TRY", catch: "CATCH", finally: "FINALLY",

    // Declarations
    var: "VAR", let: "LET", const: "CONST",
    function: "FUNCTION", class: "CLASS", extends: "EXTENDS",
    import: "IMPORT", export: "EXPORT",

    // Operators / expressions
    new: "NEW", delete: "DELETE", typeof: "TYPEOF",
    instanceof: "INSTANCEOF", in: "IN", void: "VOID",
    yield: "YIELD", await: "AWAIT", async: "ASYNC",

    readonly: "READONLY",

    // Literals / special
    true: "TRUE", false: "FALSE", null: "NULL",
    this: "THIS", super: "SUPER",

    // Reserved / future
    enum: "ENUM", implements: "IMPLEMENTS", interface: "INTERFACE",
    package: "PACKAGE", private: "PRIVATE", protected: "PROTECTED",
    public: "PUBLIC", static: "STATIC",

    // Module-specific
    as: "AS", from: "FROM", of: "OF"
};

export class HTMLExpressionTokenizer {
    expr: string
    index: number = 0
    tokens: Token[] = []

    public static instance() {

        return (new HTMLExpressionTokenizer())

    }

    tokenize(expr: string) {

        this.expr = expr
        const length = expr.length;

        while (this.getIndex() < length) {

            const char = expr.charAt(this.getIndex());

            switch (char) {
                case "+": {

                    if (this.matchNext("+")) {
                        this.addToken(TokenType.Increment, "++");
                        break;
                    }

                    if (this.matchNext("=")) {
                        this.addToken(TokenType.AdditionAssignment, "+=");
                        break;
                    }

                    this.tokens.push({token: TokenType.ADD, value: char})
                    break;
                }

                case "-": {

                    if (this.matchNext("-")) {
                        this.addToken(TokenType.Decrement, "--");
                        break;
                    }

                    if (this.matchNext("=")) {
                        this.addToken(TokenType.SubtractionAssignment, "-=");
                        break;
                    }

                    this.tokens.push({token: TokenType.SUB, value: char})
                    break
                }

                case "/": {

                    if (this.matchNext("=")) {
                        this.addToken(TokenType.DivisionAssignment, "/=");
                        break;
                    }

                    this.tokens.push({token: TokenType.DIV, value: char})
                    break
                }

                case "*": {

                    if (this.matchNext("*")) {

                        if (this.matchNext("=")) {
                            this.addToken(TokenType.ExponentiationAssignment, "**=");
                            break;
                        }

                        this.addToken(TokenType.Exponentiation, "**");
                        break;
                    }

                    if (this.matchNext("=")) {
                        this.addToken(TokenType.MultiplicationAssignment, "*=");
                        break;
                    }

                    this.tokens.push({token: TokenType.MUL, value: char})
                    break
                }

                case ">": {

                    if (this.matchNext(">")) {

                        if (this.matchNext(">")) {

                            if (this.matchNext("=")) {
                                this.addToken(TokenType.UnsignedRightShiftAssignment, ">>>=")
                                break;
                            }

                            this.tokens.push({token: TokenType.BIT_SHR, value: this.currentCharacter()});
                            break;
                        }

                        if (this.matchNext("=")) {
                            this.addToken(TokenType.RightShiftAssignment, ">>=")
                            break;
                        }

                        this.tokens.push({token: TokenType.SHR, value: this.currentCharacter()})
                        break;
                    }

                    if (this.matchNext("=")) {
                        this.tokens.push({token: TokenType.GREATER_THAN, value: this.currentCharacter()})
                        break;
                    }

                    this.tokens.push({token: TokenType.GREATER_EQUAL, value: char})

                    break;
                }

                case "<": {

                    if (this.matchNext("<")) {

                        if (this.matchNext("=")) {
                            this.tokens.push({token: TokenType.LeftShiftAssignment, value: "<<="})
                            break;
                        }

                        this.tokens.push({token: TokenType.SHL, value: this.currentCharacter()})
                        break;
                    }

                    if (this.matchNext("=")) {
                        this.tokens.push({token: TokenType.LESS_EQUAL, value: this.currentCharacter()})
                        break;
                    }

                    this.tokens.push({token: TokenType.LESS_THAN, value: char})
                    break;
                }

                case "&": {

                    if (this.matchNext("&")) {

                        if(this.matchNext('=')) {

                            this.addToken(TokenType.LOGICAL_AND_ASSIGN, "&&=");
                            break;

                        }

                        this.tokens.push({token: TokenType.LOGICAL_AND, value: this.currentCharacter()})
                        break;
                    }

                    if(this.matchNext('=')) {

                        this.addToken(TokenType.BITWISE_AND_ASSIGN, "&=");
                        break;

                    }

                    this.tokens.push({token: TokenType.AND, value: char})
                    break;
                }

                case "(": {
                    this.tokens.push({token: TokenType.LEFT_PAREN, value: char})
                    break;
                }

                case ")": {
                    this.tokens.push({token: TokenType.RIGHT_PAREN, value: char})
                    break;
                }

                case "[": {
                    this.tokens.push({token: TokenType.LEFT_SQUARE_BRACKET, value: char})
                    break;
                }

                case "]": {
                    this.tokens.push({token: TokenType.RIGHT_SQUARE_BRACKET, value: char})
                    break;
                }

                case "{": {
                    this.tokens.push({token: TokenType.LBRACE, value: char})
                    break
                }

                case "}": {
                    this.tokens.push({token: TokenType.RBRACE, value: char})
                    break
                }

                case ",": {
                    this.tokens.push({token: TokenType.COMMA, value: char})
                    break;
                }

                case ":" : {
                    this.tokens.push({token: TokenType.COLON, value: char});
                    break
                }

                case "=": {

                    if (this.matchNext('=')) {

                        if (this.matchNext('=')) {

                            this.addToken(TokenType.STRICT_EQUAL, "===");
                            break;

                        }

                        this.addToken(TokenType.EQUAL, "==");
                        break;

                    }

                    this.addToken(TokenType.Assignment, char)
                    break;
                }

                case "!": {

                    if (this.matchNext('=')) {

                        if (this.matchNext('=')) {

                            this.addToken(TokenType.STRICT_NOTEQUAL, "!==");
                            break;

                        }

                        this.addToken(TokenType.EQUAL, "!=");
                        break;

                    }

                    this.addToken(TokenType.LOGICAL_NOT, "!");
                    break;
                }

                case "|": {

                    if (this.matchNext("|")) {

                        if (this.matchNext('=')) {

                            this.addToken(TokenType.LOGICAL_OR_ASSIGN, "||=");
                            break;

                        }

                        this.tokens.push({token: TokenType.LOGICAL_OR, value: char})
                        break
                    }

                    if (this.matchNext('=')) {

                        this.addToken(TokenType.BITWISE_OR_ASSIGN, "|=");
                        break;

                    }


                    this.tokens.push({token: TokenType.PIPE, value: char})
                    break
                }

                case ".": {
                    this.tokens.push({token: TokenType.DOT, value: char})
                    break
                }

                case '?': {

                    if (this.matchNext('?')) {

                        if (this.matchNext('=')) {

                            this.addToken(TokenType.NULLISH_COALESCING_ASSIGN, "??=");
                            break;

                        }

                        this.addToken(TokenType.NULLISH_COALESCING, "??");
                        break;

                    }

                    if (this.matchNext('.')) {

                        this.addToken(TokenType.OPTIONAL_CHAINING, "?.");
                        break;

                    }

                    this.addToken(TokenType.TERNARY, "?");
                    break;
                }

                case '~': {
                    this.addToken(TokenType.BITWISE_NOT, "~");
                    break;
                }

                case '^': {

                    if (this.matchNext('=')) {

                        this.addToken(TokenType.BITWISE_XOR_ASSIGN, "^=");
                        break;

                    }

                    this.addToken(TokenType.BITWISE_XOR, "^");
                    break;
                }

                case "%": {

                    if (this.matchNext('=')) {

                        this.addToken(TokenType.RemainderAssignment, "%=");
                        break;

                    }

                    this.addToken(TokenType.Remainder, "%")
                    break;
                }

                default: {

                    // check for string

                    if (char == '"' || char == "'") {
                        this.collectString();
                        break;
                    }

                    if (this.isDigit()) {
                        this.collectNumber()
                        break
                    }

                    // check for identifier
                    if (this.isAlphaNumeric()) {
                        // collect identifier
                        this.collectIdentifier()
                        break;
                    }

                }

            }
            this.increment()
        }

        return this.tokens

    }

    private collectNumber() {
        let char = this.currentCharacter()
        let number = char;
        this.increment()

        while (this.isDigit() && !this.isEndOf()) {
            char = this.currentCharacter()
            number += char
            this.increment()
        }
        this.index--;

        this.tokens.push({token: TokenType.NUMBER, value: number})

    }

    private collectIdentifier() {
        let char = this.currentCharacter()
        let alpha = char
        this.increment()

        while (this.isAlpha() && !this.isEndOf()) {
            char = this.currentCharacter()
            alpha += char

            this.increment()
        }

        this.index--;

        if (keywords[0] === alpha) {
            this.tokens.push({token: TokenType.TRUE, value: alpha})
        } else if (keywords[1] === alpha) {
            this.tokens.push({token: TokenType.FALSE, value: alpha})
        } else if (this.checkCharIsKeyword(alpha)) {
            const keyword = keywords[alpha];
            this.tokens.push({token: TokenType.KEYWORD, value: keyword})
        } else {
            this.tokens.push({token: TokenType.IDENTIFIER, value: alpha})
        }
    }

    checkCharIsKeyword(alpha: string): boolean {
        return !!keywords[alpha];
    }

    collectString() {

        let string = this.currentCharacter();
        this.increment()
        let char = this.currentCharacter()

        while ((char !== '"' && char !== "'") && !this.isEndOf()) {
            string += char
            this.increment()
            char = this.currentCharacter()
        }

        string += char

        this.tokens.push({
            token: TokenType.STRING,
            value: string
        })

    }

    private getIndex() {
        return this.index
    }

    private increment() {
        this.index++
    }

    private getLength() {
        return this.expr.length;
    }

    private isEndOf() {
        return this.getIndex() >= this.getLength()
    }

    private currentCharacter() {
        return this.expr[this.getIndex()]
    }

    isDigit() {

        const character = this.currentCharacter();

        return character >= '0' && character <= '9';
    }

    isAlpha() {

        const c = this.currentCharacter();

        return (c >= 'a' && c <= 'z') ||
            (c >= 'A' && c <= 'Z') ||
            c == '_' || c == '$';
    }

    isCharAlpha(c: string) {

        return (c >= 'a' && c <= 'z') ||
            (c >= 'A' && c <= 'Z') ||
            c == '_' || c == '$';
    }

    isAlphaNumeric() {

        const c = this.currentCharacter();

        return this.isCharAlpha(c) || (c >= '0' && c <= '9');
    }

    isCharAlphaNumeric(c: string) {
        return this.isCharAlpha(c) || (c >= '0' && c <= '9');
    }

    private matchNext(s: string) {
        const nextChar = this.expr[this.getIndex() + 1]

        if (nextChar === s) {
            this.increment();
            return true
        }

        return false;
    }

    addToken(token: TokenType, char: string) {
        this.tokens.push({token: token, value: char});
    }
}
