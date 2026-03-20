import {BoundText, Element, Template, Text, Comment, AttributeNode} from "../nodes";
import {ForLoopBlock, IfBlock, SwitchNode} from "../syntax-ast";
import {ASTWithSource} from "./ast";

export abstract class HtmlAstVisitor {
    abstract visitElement(expr: Element);
    abstract visitText(expr: Text);
    abstract visitBoundText(visitor: BoundText);
    abstract visitTemplate(visitor: Template);
    abstract visitIfBlock(visitor: IfBlock);
    abstract visitForLoopBlock(visitor: ForLoopBlock);
    abstract visitSwitch(visitor: SwitchNode);
    abstract visitComment(visitor: Comment);
    abstract visitAttribute(expr: AttributeNode);
    abstract visitBoundAttribute(expr: BoundAttribute);
    abstract visitBoundEvent(expr: BoundEvent);
    abstract visitReference(expr: HtmlReference);
    abstract visitVariable(expr: HtmlVariable);
}

export class DefaultHtmlAstVisitor extends HtmlAstVisitor {
    visitElement(expr: Element) {}
    visitText(expr: Text) {}
    visitBoundText(expr: BoundText) {}
    visitTemplate(expr: Template) {}
    visitIfBlock(expr: IfBlock) {}
    visitForLoopBlock(expr: ForLoopBlock) {}
    visitSwitch(expr: SwitchNode) {}
    visitComment(expr: Comment) {}
    visitAttribute(expr: AttributeNode) {}
    visitBoundAttribute(expr: BoundAttribute) {}
    visitBoundEvent(expr: BoundEvent) {}
    visitReference(expr: HtmlReference) {}
    visitVariable(expr: HtmlVariable) {}
}

export abstract class HtmlAstExpression {
    abstract accept(visitor: HtmlAstVisitor)
}

export class BoundAttribute implements HtmlAstExpression {
    constructor(
        public type: "Property" | "Attribute" | "Class" | "Style", // binding type
        public name: string,
        public value: ASTWithSource,         // expression/value
        public unit?: string,                // e.g., 'px' for style
    ) {
    }

    accept(visitor: HtmlAstVisitor) {
        return visitor.visitBoundAttribute(this)
    }
}

export class BoundEvent implements HtmlAstExpression {
    constructor(
        public name: string,             // event name
        public handler: ASTWithSource,       // event handler expression
        public target?: string              // optional target, e.g., document, window
    ) {
    }

    accept(visitor: HtmlAstVisitor) {
        visitor.visitBoundEvent(this)
    }
}

export class HtmlReference implements HtmlAstExpression {
    constructor(
        public name: string,                 // #refName
        public value: string | null,         // what it references (directive instance or element)
    ) {
    }

    accept(visitor: HtmlAstVisitor) {
        return visitor.visitReference(this)
    }
}

export class HtmlVariable implements HtmlAstExpression {
    constructor(
        public name: string,                 // #refName
        public value: string | null,         // what it references (directive instance or element)
    ) {
    }

    accept(visitor: HtmlAstVisitor) {
        visitor.visitVariable(this)
    }
}
