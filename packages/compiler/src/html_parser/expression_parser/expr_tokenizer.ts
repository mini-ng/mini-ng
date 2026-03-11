import {Token, TokenType} from "./tokens";

const keywords = ["true", "false"]

export class HTMLExpressionTokenizer {
    expr: string
    index: number = 0
    tokens: Token[] = []

    tokenize(expr: string) {

        this.expr = expr
        const length = expr.length;

        while (this.getIndex() < length) {

            const char = expr.charAt(this.getIndex());

            switch (char) {
                case "+": {
                    this.tokens.push({token: TokenType.ADD, value: char})
                    break;
                }

                case "-": {
                    this.tokens.push({token: TokenType.SUB, value: char})
                    break
                }

                case "/": {
                    this.tokens.push({token: TokenType.DIV, value: char})
                    break
                }

                case "*": {
                    this.tokens.push({token: TokenType.MUL, value: char})
                    break
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

                case ",": {
                    this.tokens.push({token: TokenType.COMMA, value: char})
                    break;
                }

                case "|": {
                    this.tokens.push({token: TokenType.PIPE, value: char})
                    break
                }

                case ".": {
                    this.tokens.push({token: TokenType.DOT, value: char})
                    break
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

        this.tokens.push({token: TokenType.NUMBER, value: +number})

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
            this.tokens.push({token: TokenType.BOOL, value: alpha})
        } else if (keywords[1] === alpha) {
            this.tokens.push({token: TokenType.BOOL, value: alpha})
        } else {
            this.tokens.push({token: TokenType.IDENTIFIER, value: alpha})
        }
    }

    collectString() {

        let string = "";
        this.increment()
        let char = this.currentCharacter()

        while ((char !== '"' /*|| char !== "'"*/) && !this.isEndOf()) {
            string += char
            this.increment()
            char = this.currentCharacter()
        }

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

}
