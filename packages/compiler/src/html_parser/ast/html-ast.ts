import {BoundText, Element, Template, Text, Comment, AttributeNode} from "../nodes";
import {ElseBlock, ElseIfBlock, ForLoopBlock, ForLoopBlockEmpty, IfBlock, SwitchNode} from "../syntax-ast";
import {ASTWithSource} from "./ast";
import {BindingType} from "./ast-impl";

export abstract class HtmlAstVisitor {
    abstract visitElement(expr: Element): void;
    abstract visitText(expr: Text): void;
    abstract visitBoundText(visitor: BoundText);
    abstract visitTemplate(visitor: Template);
    abstract visitIfBlock(visitor: IfBlock): void;
    abstract visitForLoopBlock(visitor: ForLoopBlock);
    abstract visitSwitch(visitor: SwitchNode);
    abstract visitComment(visitor: Comment);
    abstract visitAttribute(expr: AttributeNode);
    abstract visitBoundAttribute(expr: BoundAttribute);
    abstract visitBoundEvent(expr: BoundEvent);
    abstract visitReference(expr: HtmlReference);
    abstract visitVariable(expr: HtmlVariable);
    abstract visitElseIfBlock(elseIfBlock: ElseIfBlock);
    abstract visitElseBlock(elseBlock: ElseBlock);
    abstract visitForLoopBlockEmpty(param: ForLoopBlockEmpty);
}

export abstract class HtmlAstExpression {
    abstract accept(visitor: HtmlAstVisitor)
}

export class BoundAttribute implements HtmlAstExpression {
    constructor(
        public type: BindingType, // binding type
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
