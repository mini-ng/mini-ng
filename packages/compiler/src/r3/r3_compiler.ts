import {sojourn} from "../html_parser/sojourn";
import {ingestComponent} from "./ingest";
import {
    CompilationJob,
    CompilationJobKind,
    CompilationUnit,
    ComponentCompilationJob, ConstantPool,
    ViewCompilationUnit
} from "../ir/compilation";
import * as ir from "../ir";
import * as ng from "./../ir/instruction"
import * as o from "./../ir/output_ast"
import {TokenType} from "../html_parser/expression_parser/tokens";

const RENDER_FLAGS = "rf";
const CONTEXT_NAME = "ctx";

export function compileComponentFromMetadata(html: string, componentName: string): { tpl: CompilationJob, templateFn: o.FunctionExpr} {
    const ast = sojourn(html);
    const constantPool = new ConstantPool();

    const tpl = ingestComponent(componentName, ast.childNodes, constantPool)

    transform(tpl);

    const templateFn = emitTemplateFn(tpl, constantPool);

    return { tpl, templateFn };

}

export function emitTemplateFn(tpl: ComponentCompilationJob, pool: ConstantPool): o.FunctionExpr {
    const rootFn = emitView(tpl.root);
    emitChildViews(tpl.root, pool);
    return rootFn;
}

function emitChildViews(parent: ViewCompilationUnit, pool: ConstantPool): void {
    for (const unit of parent.job.units) {
        if (unit.parent !== parent.xref) {
            continue;
        }

        // Child views are emitted depth-first.
        emitChildViews(unit, pool);

        const viewFn = emitView(unit);
        pool.statements.push(viewFn.toDeclStmt(viewFn.name!));
    }
}

function emitView(view: ViewCompilationUnit): o.FunctionExpr {
    if (view.fnName === null) {
        throw new Error(`AssertionError: view ${view.xref} is unnamed`);
    }

    const createStatements: o.Statement[] = [];
    for (const op of view.create) {
        if (op.kind !== ir.OpKind.Statement) {
            throw new Error(
                `AssertionError: expected all create ops to have been compiled, but got ${
                    ir.OpKind[op.kind]
                }`,
            );
        }
        createStatements.push(op.statement);
    }
    const updateStatements: o.Statement[] = [];
    for (const op of view.update) {
        if (op.kind !== ir.OpKind.Statement) {
            throw new Error(
                `AssertionError: expected all update ops to have been compiled, but got ${
                    ir.OpKind[op.kind]
                }`,
            );
        }
        updateStatements.push(op.statement);
    }

    const createCond = maybeGenerateRfBlock(1, createStatements);
    const updateCond = maybeGenerateRfBlock(2, updateStatements);
    return o.fn(
        [new o.FnParam(RENDER_FLAGS), new o.FnParam(CONTEXT_NAME)],
        [...createCond, ...updateCond],
         undefined,
         undefined,
        view.fnName,
    );
}

function maybeGenerateRfBlock(flag: number, statements: o.Statement[]): o.Statement[] {
    if (statements.length === 0) {
        return [];
    }

    return [
        o.ifStmt(
            new o.BinaryExpr(
                o.variable(RENDER_FLAGS),
                o.literal(flag),
                TokenType.AND,
            ),
            statements,
        ),
    ];
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

            case ir.OpKind.ConditionalCreate: {
                break;
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

            case ir.OpKind.Conditional: {
                break
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
        case ir.ExpressionKind.PipeBinding: {
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
