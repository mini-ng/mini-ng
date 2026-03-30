import * as ir from './ir';
import * as o from "./output_ast"

const CORE = '';

export class Identifiers {
    static text: o.ExternalReference = {
        name: 'ɵɵtext',
        moduleName: CORE,
    };
    
}

export function text(
    slot: number,
    initialValue: string,
): ir.CreateOp {
    const args: o.Expression[] = [o.literal(slot, null)];
    if (initialValue !== '') {
        args.push(o.literal(initialValue));
    }
    return call(Identifiers.text, args);
}

function call<OpT extends ir.CreateOp | ir.UpdateOp>(
    instruction: o.ExternalReference,
    args: o.Expression[],
): OpT {
    const expr = o.importExpr(instruction).callFn(args);
    return ir.createStatementOp(new o.ExpressionStatement(expr)) as unknown as OpT;
}
