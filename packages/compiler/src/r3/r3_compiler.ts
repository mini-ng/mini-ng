import {sojourn} from "../html_parser/sojourn";
import {ingestComponent} from "./ingest";
import {CompilationJob, CompilationJobKind, CompilationUnit, ComponentCompilationJob} from "../ir/compilation";
import * as ir from "../ir/ir";
import * as ng from "./../ir/instruction"

export function compileComponentFromMetadata(html: string) {
    const ast = sojourn(html);
    const job = new ComponentCompilationJob("", [])
    const tpl = ingestComponent(job, ast.childNodes)

    transform(job, tpl);

    ir.OpList.print(job.root.create);

}

const phases = [
    { kind: CompilationJobKind.Tmpl, fn: consumeSlot },
    { kind: CompilationJobKind.Tmpl, fn: reify }
]

function transform(job, tpl) {
    for (const phase of phases) {
        phase.fn(job)
    }
}

function reify(job: CompilationJob) {
    for (const unit of job.units) {
        reifyCreateOperations(unit, unit.create);
        reifyUpdateOperations(unit, unit.update);
    }
}

function reifyCreateOperations(unit: CompilationUnit, ops: ir.OpList<ir.CreateOp>) {
    for (const op of ops) {

        switch (op.kind) {
            case ir.OpKind.Text:
                ir.OpList.replace(op, ng.text(op.handle.slot!, op.initialValue));
                break;
        }
    }
}

function reifyUpdateOperations(unit: CompilationUnit, ops: ir.OpList<ir.UpdateOp>) {

}

function consumeSlot(job: CompilationJob) {

}
