import * as o from "./output_ast"
import {ExpressionBase, Expression} from "./expression";

export interface BindingOp extends Op<UpdateOp> {
    kind: OpKind.Binding;

    xref: XrefId;

    name: string;

    expression: o.Expression | Interpolation;

    unit: string | null;

    bindingKind: BindingKind;

    isTextAttribute: boolean;

    isStructuralTemplateAttribute: boolean;

    templateKind: TemplateKind | null;

}

export enum TemplateKind {
    NgTemplate,
    Structural,
    Block,
}

export function createBindingOp(
    xref,
    kind: BindingKind,
    name: string,
    expression: o.Expression | Interpolation,
    unit: string | null,
    isTextAttribute: boolean,
    isStructuralTemplateAttribute: boolean,
    templateKind: TemplateKind | null,
): BindingOp {
    return {
        xref,
        kind: OpKind.Binding,
        bindingKind: kind,
        name,
        expression,
        unit,
        isTextAttribute,
        isStructuralTemplateAttribute,
        templateKind,
        ...NEW_OP
    }
}


export function isIrExpression(expr: o.Expression): expr is Expression {
    return expr instanceof ExpressionBase;
}

export enum BindingKind {
    Attribute,
    Style,
    Property,
    Class
}

export enum VisitorContextFlag {
    None = 0b0000,
    InChildOperation = 0b0001,
    InArrowFunctionOperation = 0b0010,
}

export type ExpressionTransform = (expr: o.Expression, flags: VisitorContextFlag) => o.Expression;

export function transformExpressionsInOp(
    op: CreateOp | UpdateOp,
    transform: ExpressionTransform,
    flags: VisitorContextFlag,
) {

    switch (op.kind) {
        case OpKind.ListEnd:
            break;
        case OpKind.RepeaterCreate:
            break;
        case OpKind.InterpolateText:
            transformExpressionsInInterpolation(op.interpolation, transform, flags);
            break;
        case OpKind.Statement:
            transformExpressionsInStatement(op.statement, transform, flags);
            break;
        case OpKind.Advance:
        // case OpKind.Container:
        // case OpKind.ContainerEnd:
        // case OpKind.ContainerStart:
        // case OpKind.DeferOn:
        // case OpKind.DisableBindings:
        case OpKind.Element:
        case OpKind.ElementEnd:
        case OpKind.ElementStart:
        // case OpKind.EnableBindings:
        // case OpKind.Namespace:
        case OpKind.Pipe:
        // case OpKind.Projection:
        // case OpKind.ProjectionDef:
        case OpKind.Template:
        case OpKind.Text:
        // case OpKind.DeclareLet:
        case OpKind.ConditionalCreate:
        case OpKind.ConditionalBranchCreate:
        // case OpKind.Control:
        // case OpKind.ControlCreate:
            // These operations contain no expressions.
            break;
        case OpKind.Listener:
            break;
        default:
            throw new Error(`AssertionError: transformExpressionsInOp doesn't handle`);
    }
}

export function transformExpressionsInExpression(
    expr: o.Expression,
    transform: ExpressionTransform,
    flags: VisitorContextFlag,
): o.Expression {
    if (expr instanceof ExpressionBase) {
        expr.transformInternalExpressions(transform, flags);
    }
    return transform(expr, flags);

}

function transformExpressionsInInterpolation(
    interpolation: Interpolation,
    transform: ExpressionTransform,
    flags: VisitorContextFlag,
) {
    for (let i = 0; i < interpolation.expressions.length; i++) {
        interpolation.expressions[i] = transformExpressionsInExpression(
            interpolation.expressions[i],
            transform,
            flags,
        );
    }
}

export function transformExpressionsInStatement(
    stmt: o.Statement,
    transform: ExpressionTransform,
    flags: VisitorContextFlag,
): void {
    if (stmt instanceof o.ExpressionStatement) {
        stmt.expr = transformExpressionsInExpression(stmt.expr, transform, flags);
    } else if (stmt instanceof o.ReturnStatement) {
        stmt.value = transformExpressionsInExpression(stmt.value, transform, flags);
    } /*else if (stmt instanceof o.DeclareVarStmt) {
        if (stmt.value !== undefined) {
            stmt.value = transformExpressionsInExpression(stmt.value, transform, flags);
        }
    }*/ else if (stmt instanceof o.IfStmt) {
        stmt.condition = transformExpressionsInExpression(stmt.condition, transform, flags);
        for (const caseStatement of stmt.trueCase) {
            transformExpressionsInStatement(caseStatement, transform, flags);
        }
        for (const caseStatement of stmt.falseCase) {
            transformExpressionsInStatement(caseStatement, transform, flags);
        }
    } else {
        throw new Error(`Unhandled statement kind: ${stmt.constructor.name}`);
    }
}

export type XrefId = number & {
    __brand: "XrefId";
};
export type ConstIndex = number & {
    __brand: "ConstIndex";
}

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

        op.debugListId = this.debugListId;

        const oldLast = this.tail.prev!;

        op.prev = oldLast;
        oldLast.next = op;

        op.next = this.tail;
        this.tail.prev = op;
    }

    *[Symbol.iterator]() {
        let current = this.head.next!;
        while (current !== this.tail) {

            const next = current.next!;
            yield current;
            current = next;
        }
    }

    static replace<OpT extends Op<OpT>>(oldOp: OpT, newOp: OpT): void {
        // oldOp.prev.next = newOp;
        // oldOp.next.prev = newOp;

        // newOp.next = oldOp.next
        // newOp.prev = oldOp.prev;

        // newOp.debugListId = oldOp.debugListId;
        if (oldOp.prev !== null) {
            oldOp.prev.next = newOp;
            newOp.prev = oldOp.prev;
        }
        if (oldOp.next !== null) {
            oldOp.next.prev = newOp;
            newOp.next = oldOp.next;
        }
        oldOp.debugListId = null;
        oldOp.prev = null;
        oldOp.next = null;

    }

    static insertBefore<OpT extends Op<OpT>>(newOp: OpT, oldOp: OpT) {

        const oldPrev = oldOp.prev
        const oldNext = oldOp.next

        newOp.prev = oldPrev;
        newOp.next = oldOp;

        oldPrev.next = newOp;

        oldOp.prev = newOp;
    }

    static print(opList: OpList<CreateOp | UpdateOp>) {
        let current = opList.head.next;
        const tail = opList.tail;

        while (current !== tail) {
            // clone the node
            const { next, prev, ...printable } = current;

            console.log(printable);

            current = current.next;
        }
    }
}

export interface StatementOp<OpT extends Op<OpT>> extends Op<OpT> {
    kind: OpKind.Statement;

    statement: o.Statement;
}
export interface ListEndOp<OpT extends Op<OpT>> extends Op<OpT> {
    kind: OpKind.ListEnd;
}

export type CreateOp =
    | ListEndOp<CreateOp>
    | StatementOp<CreateOp>
    | TextOp
    | ElementStartOp
    | ElementEndOp
    | ElementOp
    | ContainerOp
    | ContainerStartOp
    | TemplateOp
    | RepeaterCreateOp
    | ConditionalCreateOp
    | ConditionalBranchCreateOp
    | ListenerOp
    | PipeOp
    | ExtractedAttributeOp

export type UpdateOp =
    | ListEndOp<UpdateOp>
    | StatementOp<UpdateOp>
    | AdvanceOp
    | InterpolateTextOp
    | BindingOp;

export interface ElementOp extends ElementOpBase {
    kind: OpKind.Element;
}

export interface ContainerOp extends ElementOpBase {
}

export interface ContainerStartOp extends ElementOpBase {
}

export interface TemplateOp extends ElementOpBase {
}

export interface RepeaterCreateOp extends ElementOpBase {
}

export interface ConditionalCreateOp extends ElementOpBase {
}

export interface ConditionalBranchCreateOp extends ElementOpBase {
}

export type ElementOrContainerOps =
    | ElementOp
    | ElementStartOp
    | ContainerOp
    | ContainerStartOp
    | TemplateOp
    | RepeaterCreateOp
    | ConditionalCreateOp
    | ConditionalBranchCreateOp;

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
    target: XrefId;
}

export const TRAIT_CONSUMES_SLOT: Omit<ConsumesSlotOpTrait, 'xref' | 'handle'> = {
    [ConsumesSlot]: true,
    numSlotsUsed: 1,
} as const;

export const TRAIT_DEPENDS_ON_SLOT_CONTEXT: Omit<DependsOnSlot, 'target'> = {
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
    Element,
    RepeaterCreate,
    ConditionalCreate,
    ConditionalBranchCreate,
    ProjectionDef,
    Projection,
    Binding,
    ExtractedAttribute,
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

export interface LocalRef {
    name: string;

    target: string;
}

export interface ElementOrContainerOpBase extends Op<CreateOp>, ConsumesSlotOpTrait {
    kind: ElementOrContainerOps['kind'];

    xref: XrefId;

    attributes: ConstIndex | null;

    localRefs: LocalRef[] | ConstIndex | null;

    nonBindable: boolean;

}

export interface ElementOpBase extends ElementOrContainerOpBase {
    kind:
        | OpKind.Element
        | OpKind.ElementStart
        | OpKind.Template
        | OpKind.RepeaterCreate
        | OpKind.ConditionalCreate
        | OpKind.ConditionalBranchCreate;

    tag: string | null;

    namespace: Namespace;
}

export interface ElementStartOp extends ElementOpBase {
    kind: OpKind.ElementStart;
}

interface ElementEndOp extends Op<CreateOp> {
    kind: OpKind.ElementEnd;
}

export function createElementStartOp(tag: string, xref): ElementStartOp {
    return {
        namespace: undefined,
        nonBindable: false,
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
    interpolation: Interpolation;
}

export class Interpolation {
    constructor(
        public strings: string[],
        public expressions: o.Expression[],
    ) {
    }
}

export function createInterpolateTextOp(
    xref, interpolation: Interpolation): InterpolateTextOp {
    return {
        expressions: [],
        kind: OpKind.InterpolateText,
        target: xref,
        interpolation,
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

export function hasConsumesSlot(op: UpdateOp | CreateOp) {
    return op[ConsumesSlot] === true
}

export function dependsOnSlot(op: UpdateOp | CreateOp): op is UpdateOp & DependsOnSlot {
    return op[DependsOnSlotContext] === true
}

export interface ListenerOp extends Op<CreateOp> {
    kind: OpKind.Listener;

    target: XrefId;
    targetSlot: SlotHandle;

    hostListener: boolean;

    name: string;

    tag: string | null;

    handlerOps: OpList<UpdateOp>;

    handlerFnName: string | null;

    consumesDollarEvent: boolean;

    isLegacyAnimationListener: boolean;

    legacyAnimationPhase: string | null;

    eventTarget: string | null;

}

export function createListenerOp(
    target: XrefId,
    targetSlot: SlotHandle,
    name: string,
    tag: string | null,
    handlerOps: Array<UpdateOp>,
    legacyAnimationPhase: string | null,
    eventTarget: string | null,
    hostListener: boolean,
): ListenerOp {
    const handlerList = new OpList<UpdateOp>();
    handlerList.push(handlerOps);
    return {
        kind: OpKind.Listener,
        target,
        targetSlot,
        tag,
        hostListener,
        name,
        handlerOps: handlerList,
        handlerFnName: null,
        consumesDollarEvent: false,
        isLegacyAnimationListener: legacyAnimationPhase !== null,
        legacyAnimationPhase: legacyAnimationPhase,
        eventTarget,
        ...NEW_OP,
    };
}

export interface PipeOp extends Op<CreateOp>, ConsumesSlotOpTrait {
    kind: OpKind.Pipe;
    xref: XrefId;
    name: string;
}

export function createPipeOp(xref: XrefId, slot: SlotHandle, name: string): PipeOp {
    return {
        kind: OpKind.Pipe,
        xref,
        handle: slot,
        name,
        ...NEW_OP,
        ...TRAIT_CONSUMES_SLOT,
    };
}

export function createAdvanceOp(delta: number): AdvanceOp {
    return {
        delta,
        kind: OpKind.Advance,
        ...NEW_OP
    }
}

export interface ExtractedAttributeOp extends Op<CreateOp> {
    kind: OpKind.ExtractedAttribute;

    target: XrefId;

    bindingKind: BindingKind;

    namespace: string | null;

    name: string;

    expression: o.Expression | null;

    trustedValueFn: o.Expression | null;

}

export function createExtractedAttributeOp(
    target: XrefId,
    bindingKind: BindingKind,
    namespace: string | null,
    name: string,
    expression: o.Expression | null,
): ExtractedAttributeOp {
    return {
        kind: OpKind.ExtractedAttribute,
        target,
        bindingKind,
        namespace,
        name,
        expression,
        trustedValueFn: null,
        ...NEW_OP,
    };
}
