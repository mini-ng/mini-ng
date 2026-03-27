import {AstExpression} from "./ast-impl";
import {Token} from "../expression_parser/tokens";

export type AST =
    | IdentifierAST
    | LiteralAST
    | UnaryAST
    | BinaryAST
    | PropertyReadAST
    | PropertyWriteAST
    | SafePropertyReadAST
    | CallAST
    | SafeCallAST
    | ConditionalAST
    | SequenceAST
    | BindingPipeAST
    | GroupingAST
    | TrueBooleanAST
    | FalseBooleanAST
    | NullAST
    | UndefinedAST
    | ThisAST
    | ArrayLiteralAST
    | ObjectLiteralAST
    | AssignmentAST
    | NonNullAssertAST
    | SafeKeyedReadAST;

export interface IdentifierAST {
    type: "Identifier";
    name: string;
}

export interface TrueBooleanAST {}

export interface FalseBooleanAST {}

export interface NullAST {}

export interface UndefinedAST {}

export interface LiteralAST {
    type: "Literal";
    valueType: LiteralAstType,
    value: string | number;
}

export interface UnaryAST {
    type: "Unary";
    operator: string;
    argument: AST;
}

export interface BinaryAST {
    type: "Binary";
    operator: Token;
    left: AST;
    right: AST;
}

export interface PropertyReadAST {
    type: "PropertyRead";
    receiver: AST | null;
    key: string | AST;
    computed: boolean;
}

export interface CallAST {
    type: "Call";
    callee: AST;
    args: AST[];
}

export interface ConditionalAST {
    type: "Conditional";
    test: AST;
    consequent: AST;
    alternate: AST;
}

export interface SequenceAST {
    type: "Sequence";
    expressions: AST[];
}

export interface BindingPipeAST {
    type: "Pipe";
    name: string;
    expression: AST;
    args: AST[];
}

export interface GroupingAST {
    type: "Grouping";
    expression: AST;
}

export interface ThisAST {
    type: "This";
}

export interface ArrayLiteralAST {
    type: "ArrayLiteral";
    elements: AST[];
}

// { name: user.name, age: 20 }
export interface ObjectLiteralAST {
    type: "ObjectLiteral";
    properties: {
        key: string;
        value: AST;
    }[];
}

// a = b
export interface AssignmentAST {
    type: "Assignment";
    left: AST;   // Identifier | PropertyRead | etc.
    right: AST;
}

// user!.name
export interface NonNullAssertAST {
    type: "NonNullAssert";
    expression: AST;
}

// user.name = "John"
export interface PropertyWriteAST {
    type: "PropertyWrite";
    receiver: AST;
    name: string;
    value: AST;
}

// user?.name
export interface SafePropertyReadAST {
    type: "SafePropertyRead";
    receiver: AST;
    name: string;
}

// user?.getName()
export interface SafeCallAST {
    type: "SafeCall";
    receiver: AST;
    args: AST[];
}

// user?.["name"]
export interface SafeKeyedReadAST {
    type: "SafeKeyedRead";
    receiver: AST;
    key: AST;
}

export enum AstType {
    GroupingAST,
    BindingPipeAST,
    SequenceAST,
    ConditionalAST,
    CallAST,
    PropertyReadAST,
    BinaryAST,
    UnaryAst
}

export enum LiteralAstType {
    STRING,
    NUMBER,
}

export interface ASTWithSource {
    ast: AstExpression;
    source: string;
}
