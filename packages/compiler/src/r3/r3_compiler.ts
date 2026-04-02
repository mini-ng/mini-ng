import {sojourn} from "../html_parser/sojourn";
import {ingestComponent} from "./ingest";
import {CompilationJob, CompilationJobKind, CompilationUnit, ComponentCompilationJob} from "../ir/compilation";
import * as ir from "../ir/ir";
import * as ng from "./../ir/instruction"
import {hasConsumesSlot} from "../ir/ir";

export function compileComponentFromMetadata(html: string) {
    const ast = sojourn(html);
    const tpl = ingestComponent(ast.childNodes)

    transform(tpl);

    // ir.OpList.print(job.root.create);

    return tpl;

}

const phases = [
    { kind: CompilationJobKind.Tmpl, fn: consumeSlot },
    { kind: CompilationJobKind.Tmpl, fn: reify }
]

function transform(job) {
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

                case ir.OpKind.ElementStart: {
                    ir.OpList.replace(op, ng.elementStart(op.handle.slot!, op.tag));
                    break
                }

                case ir.OpKind.ElementEnd: {
                    ir.OpList.replace(op, ng.elementEnd());
                    break
                }
        }

    }
}

function reifyUpdateOperations(unit: CompilationUnit, ops: ir.OpList<ir.UpdateOp>) {}

function consumeSlot(job: ComponentCompilationJob) {
    for (const unit of job.units) {
        var slot = 0
        for (const op of unit.create) {
            if (!ir.hasConsumesSlot(op)) {
                continue
            }

            (op as ir.ConsumesSlotOpTrait).handle.slot = slot;
            slot += 1;
        }
    }
}
