import {sojourn} from "../html_parser/sojourn";
import {ingestComponent} from "./ingest";
import {CompilationJob, CompilationJobKind, CompilationUnit, ComponentCompilationJob} from "../ir/compilation";
import * as ir from "../ir/ir";
import * as ng from "./../ir/instruction"
import * as o from "./../ir/output_ast"
import {ExpressionKind} from "../ir/expression";
import {dependsOnSlot} from "../ir/ir";

export function compileComponentFromMetadata(html: string, componentName: string): CompilationJob {
    const ast = sojourn(html);
    const tpl = ingestComponent(componentName, ast.childNodes)

    transform(tpl);

    // ir.OpList.print(job.root.create);
    return tpl;

}

const phases = [
    { kind: CompilationJobKind.Tmpl, fn: consumeSlot },
    { kind: CompilationJobKind.Tmpl, fn: generateListenerFnNames },
    // generate advance
    { kind: CompilationJobKind.Tmpl, fn: generateAdvance },
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

        ir.transformExpressionsInOp(
            op,
            (expr) => reifyIrExpression(unit, expr),
            ir.VisitorContextFlag.None,
        );

        switch (op.kind) {
            case ir.OpKind.Text: {
                ir.OpList.replace(op, ng.text(op.handle.slot!, op.initialValue));
                break;
            }

            case ir.OpKind.ElementStart: {
                ir.OpList.replace(op, ng.elementStart(op.handle.slot!, op.tag));
                break
            }

            case ir.OpKind.ElementEnd: {
                ir.OpList.replace(op, ng.elementEnd());
                break
            }

            case ir.OpKind.Listener: {

                const handlerStmts: o.Statement[] = [];
                for (const _op of (op as ir.ListenerOp).handlerOps) {
                    if (_op.kind === ir.OpKind.Statement) {
                        handlerStmts.push(_op.statement);
                    }
                }

                const params: o.FnParam[] = [];
                // if (consumesDollarEvent) {
                //     params.push(new o.FnParam('$event'));
                // }

                const listenerFn = ng.fn(params, handlerStmts, op.handlerFnName);

                ir.OpList.replace(op, ng.listener(op.name, listenerFn))
                break;
            }

            case ir.OpKind.Pipe: {
                ir.OpList.replace(op, ng.pipe(op.handle.slot, op.name))
            }
        }

    }
}

function reifyUpdateOperations(unit: CompilationUnit, ops: ir.OpList<ir.UpdateOp>) {
    for (const op of ops) {

        ir.transformExpressionsInOp(
            op,
            (expr) => reifyIrExpression(unit, expr),
            ir.VisitorContextFlag.None,
        );

        switch (op.kind) {
            case ir.OpKind.Advance: {
                ir.OpList.replace(op, ng.advance(op.delta!));
                break;
            }

            case ir.OpKind.InterpolateText: {
                ir.OpList.replace(op, ng.interpolateText(op.interpolation.strings, op.interpolation.expressions));
                break;
            }
        }

    }
}

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

function generateListenerFnNames(job: ComponentCompilationJob) {
    for (const unit of job.units) {
        for (const op of unit.create) {
            if (op.kind === ir.OpKind.Listener) {
                const fnName = unit.fnName + "_Listener_" + (op.prev as ir.ConsumesSlotOpTrait).handle.slot.toString()
                op.handlerFnName = fnName
            }
        }
    }
}

function reifyIrExpression(unit: CompilationUnit, expr: o.Expression) {

    if (!ir.isIrExpression(expr)) {
        return expr;
    }

    switch (expr.kind) {
        case ExpressionKind.PipeBinding: {
            return ng.pipeBind(expr.targetSlot.slot, expr.varOffset)
        }

        default:
            throw new Error(
                `AssertionError: Unsupported reification of ir.Expression kind:
                }`,
            );
    }

}

function generateAdvance(job: ComponentCompilationJob) {
    for (const unit of job.units) {
        for (const op of unit.update) {

            // if op depends on slot, then prepend advance
            if (!ir.dependsOnSlot(op)) {
                continue
            }

            const advanceOp = ir.createAdvanceOp(op.target)

            ir.OpList.insertBefore<ir.UpdateOp>(advanceOp, op)

        }
    }
}
