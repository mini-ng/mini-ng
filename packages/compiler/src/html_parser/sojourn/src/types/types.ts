export type Attribute = {
    name?: string;
    value?: string;
}

export interface NodeToken {
    type: "node";
    name: string;
    startTag?: boolean;
    endTag?: boolean;
    selfClosing?: boolean;
    attributes?: Attribute[];
}

export interface TextToken {
    type: "text";
    name: string;
}

export interface ExpressionToken {
    type: "expression";
    name: string;
}

export interface EOFToken {
    type: "EOF";
    name: "EOF";
}

export type Token = NodeToken | TextToken | ExpressionToken | EOFToken;
