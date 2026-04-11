import {ComponentCompilationJob} from "../../ir/compilation";
import * as ir from "../../ir";

export function generatePipes(job: ComponentCompilationJob) {
    for (const unit of job.units) {
        for (const op of unit.update) {
            ir.visitExpressionsInOp(op, (expr, flags) => {

                if (!ir.isIrExpression(expr)) {
                    return;
                }

                if (expr.kind !== ir.ExpressionKind.PipeBinding) { return; }

                // we will need to insert pipe(...) in the create.
                // find where updateOp slot is in create
                // and insert pipe(...) call before the slot

                // loop through create OpList
                for (let current = unit.create.head.next!; current.kind !== ir.OpKind.ListEnd; current = current.next!) {

                    if (!ir.hasConsumesSlot(current)) continue

                    if (current.xref !== (op as any).target) continue

                    while (current.next!.kind === ir.OpKind.Pipe) {
                        current = current.next!;
                    }

                    // create pipe
                    const pipe = ir.createPipeOp(expr.target, expr.targetSlot, expr.name) as ir.CreateOp;
                    ir.OpList.insertBefore(pipe, current.next);

                    return;
                }

            })
        }
    }
}
