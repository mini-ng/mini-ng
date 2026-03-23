export interface Token {
    token: TokenType;
    value: string;
}

export enum TokenType {
    STRING,
    NUMBER,
    TRUE,
    FALSE,
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
    LEFT_SQUARE_BRACKET, // [
    RIGHT_SQUARE_BRACKET, // ]
    TERNARY,
    COLON,
    LESS_THAN,
    GREATER_THAN,
    SHL,
    SHR,
    BIT_SHR,
    LESS_EQUAL,
    GREATER_EQUAL,
    OR,
    LOGICAL_AND,
    AND,
    LBRACE, // {
    RBRACE, // }
    SPREAD, // ...
    KEYWORD,
    STRICT_EQUAL,
    STRICT_NOTEQUAL
}
