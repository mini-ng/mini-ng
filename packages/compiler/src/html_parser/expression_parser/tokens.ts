export interface Token {
    token: TokenType;
    value: string;
}

export enum TokenType {
    STRING,
    NUMBER,
    BOOL,
    ADD,
    SUB,
    DIV,
    MUL,
    IDENTIFIER,
    COMMA,
    LEFT_PAREN,
    RIGHT_PAREN,
    PIPE,
    DOT,
    LEFT_SQUARE_BRACKET,
    RIGHT_SQUARE_BRACKET,
    TERNARY,
    COLON,
}
