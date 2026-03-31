import * as o from "./output_ast"
import {Expression} from "./output_ast";

export type XrefId = number & {
    __brand: "XrefId";
};

// | Trait                  | Meaning                                            |
// | ---------------------- | -------------------------------------------------- |
// | `ConsumesSlot`         | “I need storage in LView”                          |
// | `DependsOnSlotContext` | “I operate on the current cursor (ɵɵadvance)”      |
// | `ConsumesVars`         | “I use binding variables (change detection slots)” |
// | `UsesVarOffset`        | “I need to know where binding slots start”         |

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
        const tail = this.tail;
        while (current !== tail) {
            yield current;
            current = current.next;
        }
    }

    static replace<OpT extends Op<OpT>>(oldOp: OpT, newOp: OpT): void {
        oldOp.prev.next = newOp;
        oldOp.next.prev = newOp;

        newOp.next = oldOp.next
        newOp.prev = oldOp.prev;
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
    | InterpolateTextOp;

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

export interface ConsumesVars {
    readonly [ConsumesVarsTrait]: true
}

export interface UsesVarOffset {
    readonly [UsesVarOffset]: true
}

export interface DependsOnSlot {
    readonly [DependsOnSlotContext]: true
}

export const TRAIT_CONSUMES_SLOT: Omit<ConsumesSlotOpTrait, 'xref' | 'handle'> = {
    [ConsumesSlot]: true,
    numSlotsUsed: 1,
} as const;

export const TRAIT_DEPENDS_ON_SLOT_CONTEXT: DependsOnSlot = {
    [DependsOnSlotContext]: true
}

export const TRAIT_USES_VARS: UsesVarOffset = {
    [UsesVarOffset]: true
}

export const TRAIT_CONSUMES_VARS: ConsumesVars = {
    [ConsumesVarsTrait]: true
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

export class ArrowFunctionExpr {}

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

export class Interpolation {
    constructor(
        public strings: string[],
        public expressions: Expression[],
    ) {
    }
}

export function createInterpolateTextOp(
    xref, interpolation: Interpolation): InterpolateTextOp {
    return {
        expressions: [],
        kind: OpKind.InterpolateText,
        target: xref,
        ...TRAIT_DEPENDS_ON_SLOT_CONTEXT,
        ...TRAIT_CONSUMES_VARS,
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
