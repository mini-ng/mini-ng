import {AstExpression} from "./ast-impl";

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
    | NonNullAssertAST;

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
    operator: string;
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

export interface ThisAST {}
export interface ArrayLiteralAST {}
export interface ObjectLiteralAST {}
export interface AssignmentAST {}
export interface NonNullAssertAST {}
export interface PropertyWriteAST {}
export interface SafePropertyReadAST {}
export interface SafeCallAST {}

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
