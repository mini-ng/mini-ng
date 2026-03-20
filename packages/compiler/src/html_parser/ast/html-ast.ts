import {BoundText, Element, Template, Text, Comment, Node, AttributeNode} from "../nodes";
import {ForLoopBlock, IfBlock, SwitchNode} from "../syntax-ast";
import {TemplateStmt} from "../../template/view_generator";
import ts from "typescript";
import {sojourn} from "../sojourn/src";
import {AttributeMarker} from "../../template/attribute_marker";
import {
    _generateTextInterpolateNode,
    generateAdvanceNode,
    generateElementEndNode,
    generateElementStartNode, generateTextInterpolateNode,
    generateTextNode
} from "../../node-generation/node-generation";
import {ASTWithSource} from "./ast";
import {TemplateVisitor} from "../../visitor/template-visitor";

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
        visitor.visitBoundAttribute(this)
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
        visitor.visitReference(this)
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

export class HtmlAstVisitorImpl extends HtmlAstVisitor {

    private readonly stmts: ts.ExpressionStatement[] = [];
    private readonly updateStmts: ts.ExpressionStatement[] = [];
    private readonly templateStmts: TemplateStmt[] = []
    private consts: ts.Expression[] = [];
    private readonly outsideStatements: ts.Statement[] = [];
    private slot = 0;
    private index = 0;
    private readonly implicitVariables = []
    private ngContents = []
    private readonly astVisitor = new TemplateVisitor();

    generateView(html: string) {

        const ast = sojourn(html);

        ast.childNodes.forEach(childNode => {
            childNode.accept(this);
            this.incrementIndex();
        })

        return {
            stmts: this.stmts,
            updateStmts: this.updateStmts,
            templateStmts: this.templateStmts,
            consts: this.consts,
            outsideStatements: this.outsideStatements,
        };

    }

    visitBoundText(expr: BoundText) {

        const index = this.index;

        this.stmts.push(generateTextNode(index));

        this.updateStmts.push(generateAdvanceNode(index.toString()));

        this.updateStmts.push(_generateTextInterpolateNode(expr.value.ast.accept(this.astVisitor), this.implicitVariables))

    }

    visitComment(visitor: Comment) {

    }

    visitElement(el: Element) {

        const attrsIndex = this.visitAllAttributes(el.attributeNodes)

        el.inputs.forEach(input => {
            input.accept(this)
        })

        el.outputs.forEach(output => {
            output.accept(this)
        })

        el.references.forEach(ref => {
            ref.accept(this)
        })

        const startNode = generateElementStartNode(this.index, el.name, attrsIndex)
        this.stmts.push(startNode)

        el.childNodes.forEach(childNode => {
            this.incrementIndex()
            childNode.accept(this)
        });

        const endNode = generateElementEndNode()
        this.stmts.push(endNode)

    }

    visitForLoopBlock(visitor: ForLoopBlock) {
    }

    visitIfBlock(visitor: IfBlock) {
    }

    visitSwitch(visitor: SwitchNode) {
    }

    visitTemplate(visitor: Template) {
    }

    visitText(expr: Text) {
        this.stmts.push(generateTextNode(this.index, expr.data))
    }

    visitAllAttributes(attributeNodes: AttributeNode[]) {

        const constLength = this.consts.length

        attributeNodes.forEach(node => {
            node.accept(this)
        });

        if (this.consts.length > constLength) {
            return this.consts.length - 1
        }

        return null

    }

    visitAttribute(expr: AttributeNode) {

        // let attrIndex;

        let attr_marker: AttributeMarker;
        const tempConstsStmts = [];

        const { name, value } = expr

        switch (expr.name) {
            case 'style': {
                attr_marker = AttributeMarker.Styles;
                break;
            }

            case 'class': {
                attr_marker = AttributeMarker.Classes;
                break;
            }

            default: {
                break;
            }
        }

        if (!attr_marker) {
            tempConstsStmts.unshift(ts.factory.createStringLiteral(value))
            tempConstsStmts.unshift(ts.factory.createStringLiteral(name))
        } else {
            tempConstsStmts.push(ts.factory.createNumericLiteral(attr_marker))
        }

        // if (!isTemplate) {

            if (attr_marker & AttributeMarker.Classes) {
                value.split(" ").forEach(attrValue => {
                    tempConstsStmts.push(ts.factory.createStringLiteral(attrValue))
                })
            }

            if (attr_marker & AttributeMarker.Styles) {
                value.split(":").forEach(attrValue => {
                    tempConstsStmts.push(ts.factory.createStringLiteral(attrValue))
                })
            }

        // }

        // here, push consts
        if (tempConstsStmts.length > 0) {
            this.consts.push(
                ts.factory.createArrayLiteralExpression(
                    tempConstsStmts
                )
            )
            // attrIndex = this.consts.length - 1
        }

    }

    incrementIndex() {
        this.index++
    }

    visitBoundAttribute(expr: BoundAttribute) {
    }

    visitBoundEvent(expr: BoundEvent) {
    }

    visitReference(expr: HtmlReference) {
    }

    visitVariable(expr: HtmlVariable) {
    }

}
