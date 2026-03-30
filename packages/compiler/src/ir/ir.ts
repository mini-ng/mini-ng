export type XrefId = number & {
    __brand: "XrefId";
};

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
}

export type CreateOp = TextOp
    | ElementStartOp
    | ElementEndOp

export type UpdateOp = AdvanceOp

export const ConsumesSlot: unique symbol = Symbol('ConsumesSlot');

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
