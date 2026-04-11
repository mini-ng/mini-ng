import * as ir from './ir';
import * as o from "./output_ast"
import {LiteralAstType} from "../html_parser/ast/ast";

export function conditional(processed: o.Expression, contextValue: o.Expression) {
    return call(Identifiers.conditional, [processed]);
}

export function conditionalCreate(tag: string, slot: number, fnName: string, attributes: ir.ConstIndex, localRefs: ir.ConstIndex | ir.LocalRef[]) {
    return call(Identifiers.conditionalCreate, [o.literal(slot), o.literal(tag), o.literal(fnName)]);
}

export function pipe(slot: number, name: string) {
    return call(Identifiers.pipe, [o.literal(slot), o.literal(name)]);
}

export function interpolateText(strings: string[], expressions: o.Expression[]) {
    return call(Identifiers.interpolateText, [
        ...strings.map( str => o.literal(str, undefined, LiteralAstType.STRING)),
        ...expressions
    ]);
}

export function listener(name: string, listenerFn: o.FunctionExpr) {
    return call(Identifiers.listener, [
        o.literal(name, undefined, LiteralAstType.STRING),
        listenerFn
    ])
}


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


const CORE = '@mini-ng/core';

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

    static listener: o.ExternalReference = {
        name: 'ɵɵlistener',
        moduleName: CORE,
    }

    static interpolateText: o.ExternalReference = {
        name: 'ɵɵinterpolateText',
        moduleName: CORE,
    }
    static pipeBind: o.ExternalReference = {
        name: 'ɵɵpipeBind',
        moduleName: CORE,
    };

    static pipe: o.ExternalReference = {
        name: 'ɵɵpipe',
        moduleName: CORE,
    }

    static conditionalCreate: o.ExternalReference = {
        name: 'ɵɵconditionalCreate',
        moduleName: CORE,
    }

    static conditional: o.ExternalReference = {
        name: 'ɵɵconditional',
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

export function fn(
    params,
    body: o.Statement[],
    fnName: string
) {
    // create function expression
    return new o.FunctionExpr(params, body, undefined, fnName)
}

export function pipeBind(slot: number, varOffset: number) {
    let instruction = Identifiers.pipeBind;
    const expr = o.importExpr(instruction).callFn([
        o.literal(slot, null, LiteralAstType.NUMBER),
        o.literal(varOffset, null, LiteralAstType.NUMBER),
    ]);
    return expr
}
