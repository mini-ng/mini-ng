import ts, {factory} from "typescript";
import {TemplateStmt} from "../../template/view_generator";
import {TemplateVisitor} from "./template-visitor";
import {sojourn} from "../sojourn/src";
import {AttributeNode, BoundText, ChildNode, Comment, Element, Template, Text} from "../nodes";
import {
    generateTextInterpolateNodeV2,
    generateAdvanceNode,
    generateConditionalNodeV2,
    generateElementEndNode,
    generateElementStartNode,
    generateListenerNode,
    generatePropertyNodeV2,
    generateRepeaterCreateNode,
    generateTemplateNode,
    generateTextNode
} from "../../node-generation/node-generation";
import {ElseBlock, ElseIfBlock, ForLoopBlock, ForLoopBlockEmpty, IfBlock, SwitchNode} from "../syntax-ast";
import {AttributeMarker} from "../../template/attribute_marker";
import {
    BoundAttribute,
    BoundEvent,
    HtmlAstVisitor,
    HtmlReference,
    HtmlVariable
} from "../ast/html-ast";
import {Conditional, Literal} from "../ast/ast-impl";
import {LiteralAstType} from "../ast/ast";

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
    private namingIndex = 0;

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

    visitAll(childNodes: ChildNode[]) {

        childNodes.forEach(childNode => {

            childNode.accept(this);
            this.incrementIndex();

        })

    }

    visitBoundText(expr: BoundText) {

        const index = this.index;

        this.stmts.push(generateTextNode(index));

        this.updateStmts.push(generateAdvanceNode(index));

        this.updateStmts.push(generateTextInterpolateNodeV2(expr.value.ast.accept(this.astVisitor), this.implicitVariables))

    }

    visitComment(comment: Comment) {

    }

    visitElement(el: Element) {

        const attrsConstsStmts = this.visitAllAttributes(el.attributeNodes)
        const boundAttributesConstsStmts = this.visitAllBoundAttributes(el.inputs);

        let attrsIndex = null;
        const tempConstsStmts = [...attrsConstsStmts, ...boundAttributesConstsStmts];

        el.outputs.forEach(output => {
            output.accept(this)
        })

        const localRefsIndex = this.visitAllReferences(el.references)

        // here, push consts
        if (tempConstsStmts.length > 0) {
            this.consts.push(
                ts.factory.createArrayLiteralExpression(
                    tempConstsStmts
                )
            )
            attrsIndex = this.consts.length - 1
        }

        const startNode = generateElementStartNode(this.index, el.name, attrsIndex, localRefsIndex)
        this.stmts.push(startNode)

        el.childNodes.forEach(childNode => {
            this.incrementIndex()
            childNode.accept(this)
        });

        const endNode = generateElementEndNode()
        this.stmts.push(endNode)

    }

    visitExternalTemplate(functionName: string, nodes: ChildNode[]) {

        const constStartingIndex = this.consts.length - 1

        const visitor = new HtmlAstVisitorImpl();
        visitor.consts = [...this.consts];
        visitor.namingIndex = this.namingIndex;

        visitor.visitAll(nodes);

        this.consts.push(...visitor.consts.slice(constStartingIndex))

        this.templateStmts.push({
            functionName: functionName,
            updateStmts: [...visitor.updateStmts],
            stmts: [...visitor.stmts],
            templateStmts: [...visitor.templateStmts]
        });

    }

    visitForLoopBlock(forLoop: ForLoopBlock) {

        const functionName = "Template_For_" + this._namingIndex() + "_Tag";

        this.visitExternalTemplate(functionName, forLoop.childNodes);

        const node = generateRepeaterCreateNode("for", this.index, functionName, )

        this.stmts.push(node);

    }

    visitForLoopBlockEmpty(param: ForLoopBlockEmpty) {
    }

    visitIfBlock(ifBlock: IfBlock) {

        const functionName = "Template_" + this._namingIndex() + "_tag_If_Conditional";
        const index = this.index;
        let containerEndIndex = index;

        const indexAst = new Literal(index, LiteralAstType.NUMBER)

        let ifCondition = new Conditional();
        ifCondition.test = ifBlock.expression.ast;
        ifCondition.consequent = indexAst

        const origCondition = ifCondition;

        const templateNode = generateTemplateNode(index, functionName, "@if");
        this.stmts.push(templateNode)

        this.visitExternalTemplate(functionName, ifBlock.childNodes);

        this.updateStmts.push(generateAdvanceNode(index))

        for (let i = ifBlock.branches.length - 1; i >= 0; i--) {

            this.incrementIndex();

            const branch = ifBlock.branches[i];

            const elseIfIndex = branch.accept(this);

            const elseIfIndexAst = new Literal(elseIfIndex, LiteralAstType.NUMBER)

            const elseIfCondition = new Conditional();
            elseIfCondition.test = branch.expression.ast;
            elseIfCondition.consequent = elseIfIndexAst;

            ifCondition.alternate = elseIfCondition

            ifCondition = elseIfCondition

            containerEndIndex = elseIfIndex

        }

        if (ifBlock.elseBranch) {

            this.incrementIndex()

            const elseIndex = ifBlock.elseBranch.accept(this);

            const elseIndexAst = new Literal(elseIndex, LiteralAstType.NUMBER)

            ifCondition.alternate = elseIndexAst;

            containerEndIndex = elseIndex;

        }

        const updateTemplateNode = generateConditionalNodeV2(index, containerEndIndex, origCondition.accept(this.astVisitor))

        this.updateStmts.push(updateTemplateNode)

    }

    visitElseIfBlock(elseIfBlock: ElseIfBlock) {

        const functionName = "Template_" + this._namingIndex() + "_tag_Else_If_Conditional";
        const index = this.index;

        this.visitExternalTemplate(functionName, elseIfBlock.childNodes);

        this.stmts.push(generateTemplateNode(index, functionName, "@elseif"));

        return index

    }

    visitElseBlock(elseBlock: ElseBlock) {
        const functionName = "Template_" + this._namingIndex() + "_tag_Else";
        const index = this.index;

        this.visitExternalTemplate(functionName, elseBlock.childNodes);

        this.stmts.push(generateTemplateNode(index, functionName, "@else"));

        return index

    }

    visitSwitch(visitor: SwitchNode) {
        // this.visitExternalTemplate(forLoop.childNodes);
    }

    visitTemplate(template: Template) {
        const attrsConstsStmts = this.visitAllAttributes(template.attributeNodes)
        const boundAttributesConstsStmts = this.visitAllBoundAttributes(template.inputs);

        let attrsIndex = null;
        const tempConstsStmts = [...attrsConstsStmts, ...boundAttributesConstsStmts];

        template.outputs.forEach(output => {
            output.accept(this)
        })

        const localRefsIndex = this.visitAllReferences(template.references)

        // here, push consts
        if (tempConstsStmts.length > 0) {
            this.consts.push(
                ts.factory.createArrayLiteralExpression(
                    tempConstsStmts
                )
            )
            attrsIndex = this.consts.length - 1
        }

        const startNode = generateTemplateNode(this.index, template.name, attrsIndex, localRefsIndex)
        this.stmts.push(startNode)

        template.childNodes.forEach(childNode => {
            this.incrementIndex()
            childNode.accept(this)
        });

    }

    visitText(expr: Text) {
        this.stmts.push(generateTextNode(this.index, expr.data))
    }

    visitAllAttributes(attributeNodes: AttributeNode[]) {

        const tempConstsStmts = []

        attributeNodes.forEach(node => {
            const constsStmts = node.accept(this);
            tempConstsStmts.push(...constsStmts);
        });

        return tempConstsStmts

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
            // this.consts.push(
            //     ts.factory.createArrayLiteralExpression(
            //         tempConstsStmts
            //     )
            // )
            // attrIndex = this.consts.length - 1
        }

        return tempConstsStmts

    }

    visitAllBoundAttributes(inputs: BoundAttribute[]) {
        const tempConstsStmts = []

        inputs.forEach(input => {
            const tempConstStmts = input.accept(this)
            tempConstsStmts.push(...tempConstStmts);
        })
        return tempConstsStmts;
    }

    visitBoundAttribute(expr: BoundAttribute) {

        const index = this.index;
        const propertyName = expr.name

        this.updateStmts.push(generateAdvanceNode(index.toString()));

        const node = generatePropertyNodeV2(expr.name, expr.value.ast.accept(this.astVisitor), this.implicitVariables);
        this.updateStmts.push(node);

        let attr_marker = AttributeMarker.Bindings;

        const tempConstsStmts = [];

        // !isTemplate && tempConstsStmts.push(ts.factory.createNumericLiteral(attr_marker))

        tempConstsStmts.push(ts.factory.createNumericLiteral(attr_marker))
        tempConstsStmts.push(ts.factory.createStringLiteral(propertyName))

        return tempConstsStmts

    }

    visitBoundEvent(expr: BoundEvent) {
        const eventName = expr.name;
        const node = generateListenerNode(eventName, expr.target, this.index, expr.handler.ast.accept(this.astVisitor))
        this.stmts.push(node)
    }

    visitAllReferences(refs: HtmlReference[]) {

        let localNames = [];

        refs.forEach(ref => {
            const names = ref.accept(this);
            localNames.push(...names);
        })

        if (localNames.length > 0) {
            this.consts.push(
                ts.factory.createArrayLiteralExpression(
                    [
                        ...localNames
                    ]
                )
            );

        }

        return localNames.length > 0 ? this.consts.length - 1 : null

    }

    visitReference(expr: HtmlReference) {
        return [
            factory.createStringLiteral(expr.name),
            factory.createStringLiteral(expr.value)
        ]
    }

    visitVariable(expr: HtmlVariable) {
    }

    incrementIndex() {
        this.index++
    }

    _namingIndex() { return ++this.namingIndex }

}
