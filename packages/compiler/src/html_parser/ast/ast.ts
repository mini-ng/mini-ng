type AST =
    | PropertyReadAST
    | MethodCallAST
    | BinaryAST
    | LiteralAST
    | BindingPipeAST
    | IdentifierAST
    | SequenceAST
    | ConditionalAst;

export interface UnaryAst {
    op: string;
    expr: AST;
}

export interface SequenceAST {
    exprs: AST[]
}

export interface ConditionalAst {
    xpr: AST;
    then: AST;
    else: AST
}

interface PropertyReadAST {
    type: "PropertyRead";
    name: string;
    receiver: AST | null;
}

interface MethodCallAST {
    type: "MethodCall";
    name: string;
    receiver: AST | null;
    args: AST[];
}

interface BinaryAST {
    operator: string;
    left: AST;
    right: AST;
}

export enum LiteralAstType {
    STRING,
    NUMBER,
    BOOLEAN,
    NULL
}

interface LiteralAST {
    type: LiteralAstType;
    value: string | number | boolean | null;
}

interface IdentifierAST {
    value: string
}

interface BindingPipeAST {
    type: "Pipe";
    name: string;
    exp: AST;
    args: AST[];
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

export {
    BinaryAST,
    BindingPipeAST,
    LiteralAST,
    MethodCallAST,
    PropertyReadAST,
    IdentifierAST,
    AST,
    ASTWithSource,
    BoundAttribute,
    BoundEvent,
    Reference
}
