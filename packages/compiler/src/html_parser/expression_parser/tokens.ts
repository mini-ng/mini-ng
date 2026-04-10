import {SourceSpan} from "../../sourcespan/sourceSpan";
import ts from "typescript";

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
    NOT_EQUAL, // !=
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
    ARROW, // =>
    BITWISE_OR, // |
    IN, // in
    INSTANCEOF, // instanceof
}

export const operatorMap: Partial<Record<TokenType, ts.SyntaxKind>> = {

    [TokenType.ADD]: ts.SyntaxKind.PlusToken,
    [TokenType.SUB]: ts.SyntaxKind.MinusToken,
    [TokenType.MUL]: ts.SyntaxKind.AsteriskToken,
    [TokenType.DIV]: ts.SyntaxKind.SlashToken,
    [TokenType.Remainder]: ts.SyntaxKind.PercentToken,
    [TokenType.Exponentiation]: ts.SyntaxKind.AsteriskAsteriskToken,

    [TokenType.Assignment]: ts.SyntaxKind.EqualsToken,
    [TokenType.AdditionAssignment]: ts.SyntaxKind.PlusEqualsToken,
    [TokenType.SubtractionAssignment]: ts.SyntaxKind.MinusEqualsToken,
    [TokenType.MultiplicationAssignment]: ts.SyntaxKind.AsteriskEqualsToken,
    [TokenType.DivisionAssignment]: ts.SyntaxKind.SlashEqualsToken,
    [TokenType.RemainderAssignment]: ts.SyntaxKind.PercentEqualsToken,
    [TokenType.ExponentiationAssignment]: ts.SyntaxKind.AsteriskAsteriskEqualsToken,

    [TokenType.BITWISE_AND_ASSIGN]: ts.SyntaxKind.AmpersandEqualsToken,
    [TokenType.BITWISE_OR_ASSIGN]: ts.SyntaxKind.BarEqualsToken,
    [TokenType.BITWISE_XOR_ASSIGN]: ts.SyntaxKind.CaretEqualsToken,
    [TokenType.LeftShiftAssignment]: ts.SyntaxKind.LessThanLessThanEqualsToken,
    [TokenType.RightShiftAssignment]: ts.SyntaxKind.GreaterThanGreaterThanEqualsToken,
    [TokenType.UnsignedRightShiftAssignment]: ts.SyntaxKind.GreaterThanGreaterThanGreaterThanEqualsToken,

    [TokenType.LOGICAL_AND_ASSIGN]: ts.SyntaxKind.AmpersandAmpersandEqualsToken,
    [TokenType.LOGICAL_OR_ASSIGN]: ts.SyntaxKind.BarBarEqualsToken,
    [TokenType.NULLISH_COALESCING_ASSIGN]: ts.SyntaxKind.QuestionQuestionEqualsToken,

    [TokenType.LESS_THAN]: ts.SyntaxKind.LessThanToken,
    [TokenType.LESS_EQUAL]: ts.SyntaxKind.LessThanEqualsToken,
    [TokenType.GREATER_THAN]: ts.SyntaxKind.GreaterThanToken,
    [TokenType.GREATER_EQUAL]: ts.SyntaxKind.GreaterThanEqualsToken,

    [TokenType.EQUAL]: ts.SyntaxKind.EqualsEqualsToken,
    [TokenType.STRICT_EQUAL]: ts.SyntaxKind.EqualsEqualsEqualsToken,
    [TokenType.STRICT_NOTEQUAL]: ts.SyntaxKind.ExclamationEqualsEqualsToken,
    [TokenType.NOT_EQUAL]: ts.SyntaxKind.ExclamationEqualsToken,

    [TokenType.LOGICAL_AND]: ts.SyntaxKind.AmpersandAmpersandToken,
    [TokenType.LOGICAL_OR]: ts.SyntaxKind.BarBarToken,
    [TokenType.LOGICAL_NOT]: ts.SyntaxKind.ExclamationToken,
    [TokenType.NULLISH_COALESCING]: ts.SyntaxKind.QuestionQuestionToken,

    [TokenType.AND]: ts.SyntaxKind.AmpersandToken,
    [TokenType.BITWISE_XOR]: ts.SyntaxKind.CaretToken,
    [TokenType.BITWISE_OR]: ts.SyntaxKind.BarToken,
    [TokenType.PIPE]: ts.SyntaxKind.BarToken,

    [TokenType.SHL]: ts.SyntaxKind.LessThanLessThanToken,
    [TokenType.SHR]: ts.SyntaxKind.GreaterThanGreaterThanToken,
    [TokenType.BIT_SHR]: ts.SyntaxKind.GreaterThanGreaterThanGreaterThanToken,

    [TokenType.Increment]: ts.SyntaxKind.PlusPlusToken,
    [TokenType.Decrement]: ts.SyntaxKind.MinusMinusToken,
    [TokenType.BITWISE_NOT]: ts.SyntaxKind.TildeToken,

    [TokenType.TERNARY]: ts.SyntaxKind.QuestionToken,
    [TokenType.COLON]: ts.SyntaxKind.ColonToken,

    [TokenType.COMMA]: ts.SyntaxKind.CommaToken,
    [TokenType.DOT]: ts.SyntaxKind.DotToken,

    [TokenType.LEFT_PAREN]: ts.SyntaxKind.OpenParenToken,
    [TokenType.RIGHT_PAREN]: ts.SyntaxKind.CloseParenToken,

    [TokenType.LEFT_SQUARE_BRACKET]: ts.SyntaxKind.OpenBracketToken,
    [TokenType.RIGHT_SQUARE_BRACKET]: ts.SyntaxKind.CloseBracketToken,

    [TokenType.LBRACE]: ts.SyntaxKind.OpenBraceToken,
    [TokenType.RBRACE]: ts.SyntaxKind.CloseBraceToken,

    [TokenType.OPTIONAL_CHAINING]: ts.SyntaxKind.QuestionDotToken,

    [TokenType.SPREAD]: ts.SyntaxKind.DotDotDotToken,

    [TokenType.ARROW]: ts.SyntaxKind.EqualsGreaterThanToken,

    [TokenType.IN]: ts.SyntaxKind.InKeyword,
    [TokenType.INSTANCEOF]: ts.SyntaxKind.InstanceOfKeyword,

};

export enum BinaryOperator {
    ADD,                // +
    SUB,                // -
    MUL,                // *
    DIV,                // /
    Remainder,          // %

    Exponentiation,     // **

    LESS_THAN,          // <
    GREATER_THAN,       // >
    LESS_EQUAL,         // <=
    GREATER_EQUAL,      // >=

    EQUAL,              // ==
    NOT_EQUAL,          // !=
    STRICT_EQUAL,       // ===
    STRICT_NOTEQUAL,    // !==

    LOGICAL_AND,        // &&
    LOGICAL_OR,         // ||

    NULLISH_COALESCING, // ??

    BITWISE_AND,        // &
    BITWISE_OR,         // |
    BITWISE_XOR,        // ^

    SHL,                // <<
    SHR,                // >>
    BIT_SHR,            // >>>

    INSTANCEOF,         // instanceof
    IN,                 // in
}
