export type AST =
    | IdentifierAST
    | LiteralAST
    | BinaryAST
    | UnaryAST
    | PropertyReadAST
    | CallAST
    | ConditionalAST
    | SequenceAST
    | BindingPipeAST
    | GroupingAST;

export interface IdentifierAST {
    type: "Identifier";
    name: string;
}

export interface LiteralAST {
    type: "Literal";
    valueType: LiteralAstType,
    value: string | number | boolean | null;
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
    BOOLEAN,
    NULL
}

interface ASTWithSource {
    ast: AST;        // parsed AST node (see below)
    source: string;  // original expression string
}

interface BoundAttribute {
    name: string;                 // attribute name
    type: "Property" | "Attribute" | "Class" | "Style"; // binding type
    value: ASTWithSource;         // expression/value
    unit?: string;                // e.g., 'px' for style
}

interface BoundEvent {
    name: string;                 // event name
    handler: ASTWithSource;       // event handler expression
    target?: string;              // optional target, e.g., document, window
}

interface Reference {
    name: string;                 // #refName
    value: string | null;         // what it references (directive instance or element)
}
