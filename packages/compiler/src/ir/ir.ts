import * as o from "./output_ast"

export type XrefId = number & {
    __brand: "XrefId";
};

export const ConsumesSlot: unique symbol = Symbol('ConsumesSlot');
export const DependsOnSlotContext: unique symbol = Symbol('DependsOnSlotContext');
export const ConsumesVarsTrait: unique symbol = Symbol('ConsumesVars');
export const UsesVarOffset: unique symbol = Symbol('UsesVarOffset');

export interface Op<OpT extends Op<OpT>> {
    kind: OpKind;
    prev: OpT | null;

    next: OpT | null;
    debugListId: number | null;
}

export interface Op<OpT extends Op<OpT>> {
    kind: OpKind;

    prev: OpT | null;

    next: OpT | null;
}

export class OpList<OpT extends Op<OpT>> {
    static nextListId = 0;

    readonly debugListId = OpList.nextListId++;

    readonly head: OpT = {
        kind: OpKind.ListEnd,
        next: null,
        prev: null,
    } as OpT;

    readonly tail = {
        kind: OpKind.ListEnd,
        next: null,
        prev: null,
    } as OpT;

    constructor() {
        this.head.next = this.tail;
        this.tail.prev = this.head;
    }

    push(op: OpT | Array<OpT>): void {
        if (Array.isArray(op)) {
            for (const o of op) {
                this.push(o);
            }
            return;
        }

        const oldLast = this.tail.prev!;

        op.prev = oldLast;
        oldLast.next = op;

        op.next = this.tail;
        this.tail.prev = op;
    }

    replace(op: Op<OpT>): void {
        if (Array.isArray(op)) {
            for (const o of op) {

            }
        }

    }

    *[Symbol.iterator]() {
        let current = this.head.next;
        while (current !== this.tail) {
            yield current;
            current = current.next;
        }
    }

    static replace<OpT extends Op<OpT>>(oldOp: OpT, newOp: OpT): void {

    }

    static print(op: OpList<CreateOp>) {
        let current = op.head;
        const tail = op.tail;

        while (current.next !== tail) {
            console.log(current)
            current = current.next;
        }
    }
}

export interface StatementOp<OpT extends Op<OpT>> extends Op<OpT> {
    kind: OpKind.Statement;

    statement: o.Statement;
}

export type CreateOp = TextOp
    | ElementStartOp
    | ElementEndOp

export type UpdateOp = AdvanceOp

export interface Op<OpT extends Op<OpT>> {
    kind: OpKind;
}

export class SlotHandle {
    slot: number | null = null;
}

export interface ConsumesSlotOpTrait {
    readonly [ConsumesSlot]: true;

    handle: SlotHandle;
    numSlotsUsed: number;

    xref: XrefId;
}

export const TRAIT_CONSUMES_SLOT: Omit<ConsumesSlotOpTrait, 'xref' | 'handle'> = {
    [ConsumesSlot]: true,
    numSlotsUsed: 1,
} as const;

export interface ConsumesVars {
    readonly [ConsumesVarsTrait]: true
}

export interface DependsOnVars {
    readonly [UsesVarOffset]: true
}

export interface DependsOnSlot {
readonly [DependsOnSlotContext]: true
}

export const NEW_OP: Pick<Op<any>, 'debugListId' | 'prev' | 'next'> = {
    debugListId: null,
    prev: null,
    next: null,
};

export enum OpKind {
    ListEnd,
    Text,
    ElementStart,
    ElementEnd,
    Pipe,
    Template,
    Listener,
    Advance,
    Property,
    Attribute,
    Style,
    Class,
    InterpolateText,
    Statement,
}

export interface TextOp extends Op<CreateOp>, ConsumesSlotOpTrait {
    kind: OpKind.Text;

    xref: XrefId;

    initialValue: string;
}

export enum Namespace {
    HTML,
    SVG,
    Math,
}

export function createTextOp(
    xref: XrefId,
    initialValue: string,
): TextOp {
    return {
        kind: OpKind.Text,
        xref,
        handle: new SlotHandle(),
        initialValue,
        ...TRAIT_CONSUMES_SLOT,
        ...NEW_OP
    };
}

export interface AdvanceOp extends Op<UpdateOp> {
    kind: OpKind.Advance;

    delta: number;
}

export class ArrowFunctionExpr {
}

interface ElementStartOp  extends Op<CreateOp>, ConsumesSlotOpTrait {
    kind: OpKind.ElementStart;

    xref: XrefId;
    tag: string;
    attributes: null,
    localRefs: [],
}

interface ElementEndOp extends Op<CreateOp> {
    kind: OpKind.ElementEnd;
}

export function createElementStartOp(tag: string, xref): ElementStartOp {
    return {
        handle: new SlotHandle(),
        attributes: null,
        localRefs: [],
        tag,
        xref,
        kind: OpKind.ElementStart,
        ...TRAIT_CONSUMES_SLOT,
        ...NEW_OP
    }
}

export function createElementEndOp(xref): ElementEndOp {
    return {
        kind: OpKind.ElementEnd,
        xref,
        ...NEW_OP

    }
}

interface ElementEndOp extends Op<CreateOp> {
    kind: OpKind.ElementEnd;
    xref: XrefId;
}

export interface InterpolateTextOp
    extends Op<UpdateOp>, ConsumesVars {
    kind: OpKind.InterpolateText;
    target: XrefId;
    expressions: any[];
}

class Interpolation {
}

export function createInterpolateTextOp(textXref, interpolation: Interpolation): InterpolateTextOp {
    return {
        [ConsumesVarsTrait]: true,
        expressions: [],
        kind: OpKind.InterpolateText,
        target: textXref,
        ...NEW_OP
    };
}

export function createStatementOp<OpT extends Op<OpT>>(statement: o.Statement): StatementOp<OpT> {
    return {
        kind: OpKind.Statement,
        statement,
        ...NEW_OP,
    };
}
