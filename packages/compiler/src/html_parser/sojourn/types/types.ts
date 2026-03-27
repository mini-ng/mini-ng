import {SourceSpan} from "../../../sourcespan/sourceSpan";

export type Attribute = {
    name?: string;
    value?: string;
}

export type Input = {
    name?: string;
    value?: string;
    type?: "Property" | "Attribute" | "Class" | "Style"
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
    type?: "Property" | "Attribute" | "Class" | "Style"
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
    span: SourceSpan
}

export interface TemplateSyntaxNode {
    type: "templateSyntax";
    name: string;
    startTag?: boolean;
    endTag?: boolean;
    expression?: string;
    blockParameters: string[];
    span: SourceSpan;
}

export interface TextToken {
    type: "text";
    name: string;
    span: SourceSpan;
}

export interface ExpressionToken {
    type: "expression";
    name: string;
    span: SourceSpan;
}

export interface EOFToken {
    type: "EOF";
    name: "EOF";
    span: SourceSpan;
}

export type Token = NodeToken | TextToken | ExpressionToken | TemplateSyntaxNode | EOFToken;
