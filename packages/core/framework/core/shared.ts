import {
    ComponentDef,
    ComponentTemplate,
    CssSelector,
    DirectiveDef,
    DirectiveDefListOrFactory, Element,
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
    Type, ViewQueriesFunction
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
            if (isNodeMatchingSelectorList(tNode, def.selectors!)) {
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
    selector: any[]
): boolean {
    for (let i = 0; i < selector.length; i++) {
        if (isNodeMatchingSelector(tNode, selector[i])) {
            return true;
        }
    }

    return false;
}

export function isComponentDef<T>(def: any) {
    return !!(def).template;
}

// export function isNodeMatchingSelector(tNode: TNode,
//                                 selector: any[]
// ) {
//
//     const tNodeSelector = tNode.value;
//     const nodeAttrs = tNode.attrs;
//
//     for (let i = 0; i < selector.length; i++) {
//         const currentSelector = selector[i];
//         let mode = SelectorFlags.ELEMENT
//
//         // if (currentSelector === tNodeSelector) {
//         //     return true;
//         // }
//         //
//         // if (!nodeAttrs) {
//         //     return false;
//         // }
//         //
//         // for (let nodeAttrIndex = 0; nodeAttrIndex < nodeAttrs.length; nodeAttrIndex++) {
//         //     const nodeAttr = nodeAttrs[nodeAttrIndex];
//         //
//         //     if (Array.isArray(nodeAttr)) {
//         //         if (nodeAttr[0].toString().toLowerCase() === currentSelector.toLowerCase()) {
//         //             return true;
//         //         }
//         //
//         //         if (typeof nodeAttr[0] === "number" && nodeAttr[1].toString().toLowerCase() === currentSelector.toLowerCase()) {
//         //             return true
//         //         }
//         //     }
//         // }
//
//         if (typeof currentSelector === "number") {
//             mode = currentSelector;
//             continue;
//         }
//
//         if (mode & SelectorFlags.ELEMENT) {
//             mode = SelectorFlags.ATTRIBUTE;
//             if (
//                 (currentSelector !== '' && !hasTagAndTypeMatch(tNode, currentSelector)) ||
//                 (currentSelector === '' && selector.length === 1)
//             ) {
//                 return false;
//             }
//
//         } else if (mode & SelectorFlags.CLASS) {
//
//         } else {
//
//         }
//
//         /* else if (attribute == AttributeMarker.Bindings) {
//
//         } else if (attribute == AttributeMarker.Template) {
//
//         } */
//
//     }
//
//     return false
//
// }

export function isNodeMatchingSelector(tNode: TNode, selector: any[]): boolean {

    const nodeAttrs = tNode.attrs || [];
    let mode = SelectorFlags.ELEMENT;

    const nameOnlyMarkerIdx = nodeAttrs !== null ? getNameOnlyMarkerIndex(nodeAttrs) : 0;

    for (let i = 0; i < selector.length; i++) {

        const currentSelector = selector[i];

        if (typeof currentSelector === "number") {
            mode = currentSelector;
            continue;
        }

        if (mode & SelectorFlags.ELEMENT) {

            mode = SelectorFlags.ATTRIBUTE;

            // Fail element matching if:
            // 1. selector specifies a tag but node tag doesn't match
            // OR
            // 2. selector is empty (invalid universal selector)

            if (
                (currentSelector !== '' && !hasTagAndTypeMatch(tNode, currentSelector)) ||
                (currentSelector === '' && selector.length === 1)
            ) {
                return false;
            }

        }

        else if (mode & SelectorFlags.CLASS) {

            if (nodeAttrs == null) {
                return false;
            }

            if (!isCssClassMatching(tNode, nodeAttrs, currentSelector)) {
                return false;
            }

            // const hasClass = nodeAttrs.some(attr =>
            //     Array.isArray(attr) &&
            //     attr[0] === 'class' &&
            //     attr[1].split(' ').includes(currentSelector)
            // );
            //
            // if (!hasClass) {
            //     return false;
            // }

        }

        else if (mode & SelectorFlags.ATTRIBUTE) {

            const selectorAttrValue = selector[++i];
            const attrIndexInNode = findAttrIndexInNode( currentSelector, nodeAttrs)

            if (attrIndexInNode === -1) {
                return false;
            }

            if (selectorAttrValue !== '') {
                let nodeAttrValue: string;
                if (attrIndexInNode > nameOnlyMarkerIdx) {
                    nodeAttrValue = '';
                } else {
                    nodeAttrValue = (nodeAttrs![attrIndexInNode + 1] as string).toLowerCase();
                }

                if (mode & SelectorFlags.ATTRIBUTE && selectorAttrValue !== nodeAttrValue) {
                    return false;
                }
            }

        }

    }

    return true;
}

// function findAttrIndexInNode(
//     name: string,
//     attrs: TAttributes | null
// ) {
//     for (let i = 0; i < attrs.length; i++) {
//
//     }
// }

function findAttrIndexInNode(
    name: string,
    attrs: TAttributes | null
): number {
    if (attrs === null) return -1;

    let i = 0;
    let bindingsMode = false;

    while (i < attrs.length) {
        const maybeAttrName = attrs[i];
        if (maybeAttrName === name) {          // value‑bearing attr
            return i;
        } else if (maybeAttrName === AttributeMarker.Bindings ||
            maybeAttrName === AttributeMarker.I18n) {
            bindingsMode = true;                // enter name‑only mode
        } else if (maybeAttrName === AttributeMarker.Classes ||
            maybeAttrName === AttributeMarker.Styles) {
            // skip over class/style entries…
            //…
            continue;
        } else if (maybeAttrName === AttributeMarker.Template) {
            break;
        } else if (maybeAttrName === AttributeMarker.NamespaceURI) {
            i += 4;
            continue;
        }
        // in binding‑mode we consume 1 slot per iteration, otherwise 2
        i += bindingsMode ? 1 : 2;
    }
    return -1;
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
            def.viewQuery,
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
    viewQuery: ViewQueriesFunction<any> | null,
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
        components: null,
        queries: null,
        viewQuery,
        firstChild: null
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
        declaration_view: null,
        declaration_component_view: null,
        t_host: tHostNode
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

    const tNode: TNode = {
        type,
        index: index,
        value: tag,
        tView: tView,
        parent: parentNode,
        flags,
        attrs,
        styles: null,
        classes: null,
        localNames: null,
        inputs: null,
        outputs: null,
        componentOffset: -1,
        directiveStart: -1,
        directiveEnd: -1,
        child: null,
        next: null,
        prev: null,
        projection: null,
    }

    return tNode;

}

export function getFactoryDef<T>(type: any, throwNotFound?: boolean): FactoryFn<T> | null {
    const hasFactoryDef = type.hasOwnProperty(NG_FACTORY_DEF);
    if (!hasFactoryDef && throwNotFound === true) {
        throw new Error(`Type ${(type).toString()} does not have 'ɵfac' property.`);
    }
    return hasFactoryDef ? type[NG_FACTORY_DEF] : null;
}

function hasTagAndTypeMatch(tNode: TNode, current: string) {
    return tNode.value === current
}

// Search the TAttributes to see if it contains cssClassToMatch
function isCssClassMatching(tNode: TNode, nodeAttrs: TAttributes, current: string) {
    for (let i = 0; i < nodeAttrs.length; i++) {
        if (i === 0 && nodeAttrs[i] !== AttributeMarker.Classes) {
            return false;
        }

        // this is an attribute classes
        if (current === nodeAttrs[i]) {
            return true;
        }
    }
    return false;
}

export function getNativeByTNode(tNode: TNode, lView: LView): Element {
    // const node = unwrapRNode(lView[tNode.index]);
    return lView.data[tNode.index];
}

export function unwrapRNode(value: LView) {
    // while (Array.isArray(value)) {
    //     value = value[HOST] as any;
    // }
    // return value as RNode;
}

export function saveResolvedLocalsInData(
    viewData: LView,
    tNode: TNode,
    // localRefExtractor: LocalRefExtractor = getNativeByTNode,
): void {
    const localNames = tNode.localNames;
    if (localNames !== null) {
        let localIndex = tNode.index + 1;
        for (let i = 0; i < localNames.length; i += 2) {
            const index = localNames[i + 1] as number;
    //         const value =
    //             index === -1
    //                 ? localRefExtractor(
    //                     tNode as TElementNode | TContainerNode | TElementContainerNode,
    //                     viewData,
    //                 )
    //                 : viewData[index];
    //         viewData[localIndex++] = value;
        }
    }
}

