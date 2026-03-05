import {
    ComponentDef,
    ComponentTemplate,
    CssSelector,
    DirectiveDef,
    DirectiveDefListOrFactory,
    getComponentDef,
    getDirectiveDef,
    LView, PipeDefListOrFactory,
    runtime,
    SelectorFlags,
    TAttributes,
    TConstantsOrFactory,
    TNode, TNodeType,
    TView,
    TViewType,
    Type
} from "./core";
import {AttributeMarker} from "./attribute_marker";
import {RenderFlags} from "./render_flags";
import {setCurrentTNode} from "./state";
import {getUniqueLViewId, LViewFlags} from "./type";
import {FactoryFn} from "./pipe";

export const NG_FACTORY_DEF: string = "ɵfac";

export function findDirectiveDefMatches(
    tView: TView,
    tNode: TNode,
): any[] | null {

    const registry = tView.directiveRegistry;
    let matches: any[] | null = null;
    if (registry) {
        for (let i = 0; i < registry.length; i++) {
            const def = registry[i];
            if (isNodeMatchingSelectorList(tNode, def.selectors!, false)) {
                matches ??= [];

                if (isComponentDef(def)) {

                    matches.unshift(def);
                } else {
                    matches.push(def);
                }
            }
        }
    }

    return matches;
}

export function isNodeMatchingSelectorList(
    tNode: TNode,
    selector: any[],
    isProjectionMode: boolean = false,
): boolean {
    for (let i = 0; i < selector.length; i++) {
        if (isNodeMatchingSelector(tNode, selector[i], isProjectionMode)) {
            return true;
        }
    }

    return false;
}

export function isComponentDef<T>(def: any) {
    return !!(def).template;
}

function isNodeMatchingSelector(tNode: TNode,
                                selector: any[],
                                isProjectionMode: boolean = false,) {

    const tNodeSelector = tNode.value;
    const nodeAttrs = tNode.attrs;

    for (let i = 0; i < selector.length; i++) {
        const currentSelector = selector[i]

        if (currentSelector === tNodeSelector) {
            return true;
        }

        if (!nodeAttrs) {
            return false;
        }

        for (let nodeAttrIndex = 0; nodeAttrIndex < nodeAttrs.length; nodeAttrIndex++) {
            const nodeAttr = nodeAttrs[nodeAttrIndex];

            if (Array.isArray(nodeAttr)) {
                if (nodeAttr[0].toString().toLowerCase() === currentSelector.toLowerCase()) {
                    return true;
                }

                if (typeof nodeAttr[0] === "number" && nodeAttr[1].toString().toLowerCase() === currentSelector.toLowerCase()) {
                    return true
                }
            }
        }

        /* else if (attribute == AttributeMarker.Bindings) {

        } else if (attribute == AttributeMarker.Template) {

        } */

    }

    return false

}

function findAttrIndexInNode(
    name: string,
    attrs: TAttributes | null
) {
    for (let i = 0; i < attrs.length; i++) {

    }
}

export function extractDirectiveDef(type: Type<any>): DirectiveDef<any> | ComponentDef<any> | null {
    return getComponentDef(type) || getDirectiveDef(type);
}

function getNameOnlyMarkerIndex(nodeAttrs: TAttributes) {
    for (let i = 0; i < nodeAttrs.length; i++) {
        const nodeAttr = nodeAttrs[i];
        if (isNameOnlyAttributeMarker(nodeAttr)) {
            return i;
        }
    }
    return nodeAttrs.length;
}

export function isNameOnlyAttributeMarker(marker: string | AttributeMarker | CssSelector) {
    return (
        marker === AttributeMarker.Bindings ||
        marker === AttributeMarker.Template ||
        marker === AttributeMarker.I18n
    );
}

export function allocExpando(
    tView: TView,
    lView: LView,
    numSlotsToAlloc: number,
    initialValue: unknown,
): number {
    if (numSlotsToAlloc === 0) return -1;
    const allocIdx = lView.directive_instances.length;
    for (let i = 0; i < numSlotsToAlloc; i++) {
        lView.directive_instances.push(initialValue);
        // tView.blueprint.push(initialValue);
        tView.directives.push(null);
    }
    return allocIdx;
}


export function getOrCreateComponentTView(def: ComponentDef<any>): TView {
    const tView = def.tView;

    if (tView === null) {

        const declTNode = null;

        return (def.tView = createTView(
            TViewType.Component,
            declTNode,
            def.template,
            def.decls,
            def.vars,
            def.directiveDefs,
            def.pipeDefs,
            def.consts,
            def.id,
        ));
    }

    return tView;
}

export function invokeDirectivesHostBindings(tView: TView, lView: LView, tNode: TNode) {
    const start = tNode.directiveStart;
    const end = tNode.directiveEnd;
    const elementIndex = tNode.index;
    // const currentDirectiveIndex = getCurrentDirectiveIndex();
    try {
        setSelectedIndex(elementIndex);
        for (let dirIndex = start; dirIndex < end; dirIndex++) {
            const def = tView.directives[dirIndex] as DirectiveDef<unknown>;
            const directive = lView.directive_instances[dirIndex];
            // setCurrentDirectiveIndex(dirIndex);
            if (def.hostBindings !== null /*|| def.hostVars !== 0 || def.hostAttrs !== null*/) {
                invokeHostBindingsInCreationMode(def, directive);
            }
        }
    } finally {
        setSelectedIndex(-1);
        // setCurrentDirectiveIndex(currentDirectiveIndex);
    }

}

export function createTView(
    type: TViewType,
    declTNode: TNode | null,
    templateFn: ComponentTemplate<any> | null,
    decls: number,
    vars: number,
    directives: DirectiveDefListOrFactory | null,
    pipes: PipeDefListOrFactory | null,
    constsOrFactory: TConstantsOrFactory | null,
    ssrId: string | null,
): TView {

    const blueprint = []
    const consts = typeof constsOrFactory === 'function' ? constsOrFactory() : constsOrFactory;
    const tView: TView = ({
        type: type,
        blueprint: null,
        template: templateFn,
        data: blueprint.slice().fill(null, 0),
        firstCreatePass: true,
        directiveRegistry: typeof directives === 'function' ? directives() : directives,
        pipeRegistry: typeof pipes === 'function' ? pipes() : pipes,
        consts: consts,
        styles: [],
        id: ssrId,
        components: null
    });

    return tView;
}

export function isComponentHost(tNode: TNode): boolean {
    return tNode.componentOffset > -1;
}

export function setSelectedIndex(index: number) {
    runtime.selectedIndex = index
}

export function invokeHostBindingsInCreationMode(def: DirectiveDef<any>, directive: any) {

    if (def.hostBindings !== null) {
        def.hostBindings!(RenderFlags.CREATE, directive);
    }
}

export function processHostBindingOpCodes(tView: TView, lView: LView, tNode: TNode) {

    setCurrentTNode(tNode, false)

    const start = tNode.directiveStart;
    const end = tNode.directiveEnd;
    const elementIndex = tNode.index;

    try {
        setSelectedIndex(elementIndex);
        for (let dirIndex = start; dirIndex < end; dirIndex++) {
            const def = tView.directives[dirIndex] as DirectiveDef<unknown>;
            const directive = lView.directive_instances[dirIndex];
            if (def.hostBindings !== null) {
                invokeHostBindingsInUpdateMode(def, directive);
            }
        }
    } finally {
        setSelectedIndex(-1);
    }

}

function invokeHostBindingsInUpdateMode(def: DirectiveDef<any>, directive: any) {
    if (def.hostBindings !== null) {
        def.hostBindings!(RenderFlags.UPDATE, directive);
    }
}

export function mapPropName(name: string): string {
    if (name === 'class') return 'className';
    if (name === 'for') return 'htmlFor';
    if (name === 'formaction') return 'formAction';
    if (name === 'innerHtml') return 'innerHTML';
    if (name === 'readonly') return 'readOnly';
    if (name === 'tabindex') return 'tabIndex';
    return name;
}

export function markDirtyIfOnPush(lView: LView, viewIndex: number): void {
    const childComponentLView = lView.instances[viewIndex] //getComponentLViewByIndex(viewIndex, lView);
    if (!(childComponentLView.flags & LViewFlags.CheckAlways)) {
        childComponentLView.flags |= LViewFlags.Dirty;
    }
}

export function createLView<T>(
    parentLView: LView | null,
    tView: TView,
    context: T | null,
    flags: LViewFlags,
    host: any | null,
    tHostNode: TNode | null,
): LView {

    const lView: LView = {
        context,
        context_value: undefined,
        data: [],
        host,
        instances: [],
        parent: parentLView,
        queries: undefined,
        tView,
        flags: flags |
            LViewFlags.CreationMode |
            LViewFlags.Attached |
            LViewFlags.FirstLViewPass |
            LViewFlags.Dirty |
            LViewFlags.RefreshView,
        id: getUniqueLViewId(),
    }

    return lView as LView;
}

export function createTNode(
    index: number,
    tag: string,
    type: TNodeType,
    tView: TView,
    parentNode: TNode,
    attrs: any[] | null,
): TNode {
    let flags = 0;

    return {
        type,
        index: index,
        value: tag,
        tView: tView,
        parent: parentNode,
        flags,
        attrs,
        localNames: null,
        inputs: null,
        outputs: null,
        componentOffset: -1,
        directiveStart: -1,
        directiveEnd: -1,
    }
}

export function getFactoryDef<T>(type: any, throwNotFound?: boolean): FactoryFn<T> | null {
    const hasFactoryDef = type.hasOwnProperty(NG_FACTORY_DEF);
    if (!hasFactoryDef && throwNotFound === true) {
        throw new Error(`Type ${(type).toString()} does not have 'ɵfac' property.`);
    }
    return hasFactoryDef ? type[NG_FACTORY_DEF] : null;
}
