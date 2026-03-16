export type Attribute = {
    name?: string;
    value?: string;
}

export type Input = {
    name?: string;
    value?: string;
}

export type Output = {
    name?: string;
    value?: string;
}

export type Reference = {
    name?: string;
    value?: string;
}

export type TemplateAttr = {
    name?: string;
    value?: string;
}

export type Variable = {
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
    inputs?: Input[];
    outputs?: Output[];
    references?: Reference[];
    templateAttrs?: TemplateAttr[];
    variables?: Variable[];
    hasStructuralDirective?: boolean;
}

export interface TemplateSyntaxNode {
    type: "templateSyntax";
    name: string;
    startTag?: boolean;
    endTag?: boolean;
    expression?: string;
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

export type Token = NodeToken | TextToken | ExpressionToken | TemplateSyntaxNode | EOFToken;
