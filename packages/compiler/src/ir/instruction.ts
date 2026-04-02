import * as ir from './ir';
import * as o from "./output_ast"
import {LiteralAstType} from "../html_parser/ast/ast";

export function advance(delta: number) {
    return call(Identifiers.advance, delta > 1 ? [o.literal(delta)] : []);
}


export function elementStart(slot: number, tag: string) {
    const args = [
        o.literal(slot, undefined, LiteralAstType.NUMBER),
        o.literal(tag, undefined, LiteralAstType.STRING),
    ]
    return call(Identifiers.elementStart, args);
}


export function elementEnd() {
    return call(Identifiers.elementEnd, []);
}


const CORE = 'core';

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

    static advance: o.ExternalReference = {
        name: 'ɵɵadvance',
        moduleName: CORE,
    }

}

export function text(
    slot: number,
    initialValue: string,
): ir.CreateOp {
    const args: o.Expression[] = [o.literal(slot, null, LiteralAstType.NUMBER)];
    if (initialValue !== '') {
        args.push(o.literal(initialValue, null, LiteralAstType.STRING));
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
