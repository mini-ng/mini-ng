import {BoundText, ChildNode, Element, Template, Text} from "../html_parser/nodes";
import {ForLoopBlock, IfBlock, SwitchNode} from "../html_parser/syntax-ast";
import {ComponentCompilationJob, ViewCompilationUnit} from "../ir/compilation";
import * as ir from "../ir/ir"
import {
    ArrayLiteral,
    ArrowFunction,
    Binary,
    Call,
    Comma,
    Conditional,
    False,
    Grouping,
    Identifier,
    Literal,
    New,
    ObjectLiteral,
    PostfixUpdate,
    PrefixUnary,
    PrefixUpdate,
    PropertyRead,
    SafeCall,
    SafePropertyRead,
    SpreadElement,
    True,
    YieldExpression
} from "../html_parser/ast/ast-impl";

export function ingestComponent(job, nodes: ChildNode[]) {
    ingestNodes(job.root, nodes);
    return job
}

function ingestNodes(unit: ViewCompilationUnit, nodes: ChildNode[]) {

    for (const node of nodes) {

        if (node instanceof Element) {
            ingestElement(unit, node);
        }

        if (node instanceof Text) {
            ingestText(unit, node);
        }

        if (node instanceof BoundText) {
            ingestBoundText(unit, node);
        }

        if (node instanceof Template) {

        }

        if (node instanceof IfBlock) {

        }

        if (node instanceof ForLoopBlock) {

        }

        if (node instanceof SwitchNode) {

        }
    }
}

function ingestElement(unit: ViewCompilationUnit, node: Element) {
    const tag = node.tagName;
    const id = unit.job.allocateXrefId()
    // create elementStart
    const startOp = ir.createElementStartOp(tag, id);
    unit.create.push(startOp);

    ingestNodes(unit, node.children);

    const endOp = ir.createElementEndOp(id);
    unit.create.push(endOp)
}

function ingestText(unit: ViewCompilationUnit, node: Text ){
    const id = unit.job.allocateXrefId();
    unit.create.push(ir.createTextOp(id, node.data))
}


function ingestBoundText(unit: ViewCompilationUnit, node: BoundText) {

    const textXref = unit.job.allocateXrefId();

    unit.create.push(ir.createTextOp(textXref, ''))

    // unit.update.push(
    //     ir.createInterpolateTextOp(
    //         textXref,
    //         new ir.Interpolation(
    //             value.strings,
    //             value.expressions.map((expr) => convertAst(expr, unit.job)),
    //         ),
    //     ),
    // );

}

function convertAst(expr, job: ComponentCompilationJob) {

}

Comma
SpreadElement
YieldExpression
ArrowFunction
Identifier
Conditional
Binary
PrefixUnary
PrefixUpdate
PostfixUpdate
PropertyRead
SafePropertyRead
Call
SafeCall
New
Literal
True
False
Grouping
ArrayLiteral
ObjectLiteral


