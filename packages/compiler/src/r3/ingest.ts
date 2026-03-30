import {BoundText, ChildNode, Element, Template} from "../html_parser/nodes";
import {ForLoopBlock, IfBlock, SwitchNode} from "../html_parser/syntax-ast";
import {ViewCompilationUnit} from "../ir/compilation";
import * as ir from "../ir/ir"

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

}
