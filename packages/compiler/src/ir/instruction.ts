import * as ir from './ir';
import * as o from "./output_ast"

export function elementStart(slot: number, tag: string) {
    return call(Identifiers.elementStart, []);
}


export function elementEnd() {
    return call(Identifiers.elementEnd, []);
}


const CORE = '';

export class Identifiers {
    static text: o.ExternalReference = {
        name: 'ɵɵtext',
        moduleName: CORE,
    };

    static elementStart: o.ExternalReference = {
        name: 'ɵɵelementStart',
        moduleName: CORE,
    }

    static elementEnd: o.ExternalReference = {
        name: 'ɵɵelementEnd',
        moduleName: CORE,
    }

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
