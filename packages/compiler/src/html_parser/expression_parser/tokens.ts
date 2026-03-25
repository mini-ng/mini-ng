import {SourceSpan} from "../../sourcespan/sourceSpan";

export interface Token {
    token: TokenType;
    value: string;
    span?: SourceSpan
}

export enum TokenType {
    STRING,
    NUMBER,
    TRUE, // true
    FALSE, // false
    ADD, // +
    AdditionAssignment, // +=
    SUB, // -
    SubtractionAssignment, // -=
    DIV, // /
    MUL, // *
    IDENTIFIER,
    COMMA, // ,
    LEFT_PAREN, // (
    RIGHT_PAREN, // )
    PIPE, // |
    DOT, // .
    LEFT_SQUARE_BRACKET, // [
    RIGHT_SQUARE_BRACKET, // ]
    TERNARY, // ?
    COLON, // :
    LESS_THAN, // <
    GREATER_THAN, // >
    SHL, // <<
    SHR, // >>
    BIT_SHR, // >>>
    LESS_EQUAL, // =<
    GREATER_EQUAL, // >=
    LOGICAL_OR, // ||
    LOGICAL_AND, // &&
    AND, // &
    LBRACE, // {
    RBRACE, // }
    SPREAD, // ...
    KEYWORD,
    EQUAL, // ==
    STRICT_EQUAL, // ===
    STRICT_NOTEQUAL, // !==
    YIELD, // yield
    STAR, // *
    BITWISE_NOT, // ~
    BITWISE_XOR_ASSIGN, // ^=
    BITWISE_XOR, // ^
    OPTIONAL_CHAINING, // ?.
    NULLISH_COALESCING, // ??
    NULLISH_COALESCING_ASSIGN, // ??=
    LOGICAL_OR_ASSIGN, // ||=
    LOGICAL_AND_ASSIGN, // &&=
    BITWISE_OR_ASSIGN, // |=
    BITWISE_AND_ASSIGN, // &=
    UnsignedRightShiftAssignment, // >>>=
    RightShiftAssignment, // >>=
    LeftShiftAssignment, // <<=
    RemainderAssignment, // %=
    Remainder, // %
    DivisionAssignment, // /=
    MultiplicationAssignment, // *=
    ExponentiationAssignment, // **=
    Exponentiation, // **
    Assignment, // =
    LOGICAL_NOT, // !
    Increment, // ++
    Decrement, // --
    QUESTION_LEFT_SQUARE_BRACKET, // ?[
    SAFE_CALL, // ?.(
}
