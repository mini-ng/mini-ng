import {
    ComponentDef,
    DirectiveDef,
    getDefinition,
    LView, TAttributes,
    TNode,
    TNodeFlags, TNodeType,
    TView,
} from "./core";
import {
    allocExpando, createLView, createTNode,
    findDirectiveDefMatches,
    getOrCreateComponentTView,
    invokeDirectivesHostBindings,
    isComponentDef, isComponentHost, NG_FACTORY_DEF
} from "./shared";
import {getCurrentTNode, setCurrentTNode} from "./state";

type DirectiveMatcherStrategy = (tView: TView, tNode: TNode) => DirectiveDef<unknown>[] | null

export function ɵɵdefineDirective(def: any) {
    return getDefinition(def);
}

function getConstant<T>(tViewConsts: any[][], attrsIndex: number) {
    if (attrsIndex === null || attrsIndex === undefined) return null;
    return tViewConsts ? tViewConsts[attrsIndex] : null;
}

function createTNodeAtIndex(tView: TView, index: number, type: TNodeType.Element, name: string, attrs: any[]) {

    const currentTNode = getCurrentTNode()
    const isParent = currentTNode?.parent
    const parent = isParent ? currentTNode : currentTNode && currentTNode.parent;

    const tNode = createTNode(index, name, type, tView, parent, attrs)

    tView.data[index] = tNode;

    if (tView.firstChild === null) {
        tView.firstChild = tNode;
    }

    if (currentTNode !== null) {

        if (tNode.parent === currentTNode) {
            if (currentTNode.child === null) {
                currentTNode.child = tNode;
            }
        } else {
            if (currentTNode.next === null) {
                currentTNode.next = tNode;
                tNode.prev = currentTNode;
            }
        }

    }

    return tNode;
}

function getOrCreateTNode(tView: TView, index: number, type: TNodeType.Element, name: string, attrs: any[]) {
    let tNode = tView.data[index] as TNode;
    if (tNode === null || tNode === undefined) {
        tNode = createTNodeAtIndex(tView, index, type, name, attrs);
    }
    setCurrentTNode(tNode, true);
    return tNode;
}

export function directiveHostFirstCreatePass(
    index: number,
    lView: LView,
    type: TNodeType.Element,
    name: string,
    directiveMatcher: DirectiveMatcherStrategy,
    bindingsEnabled: boolean,
    attrsIndex?: number | null,
    localRefsIndex?: number,
) {

    // get or create tNode

    const tView = lView.tView;
    const tViewConsts = tView.consts;
    const attrs = getConstant<TAttributes>(tViewConsts, attrsIndex);
    const tNode = getOrCreateTNode(tView, index, type, name, attrs) as TNode
    const localRefs = getConstant(tViewConsts, localRefsIndex)

    // resolve directives
    resolveDirectives(tNode, tView, lView, directiveMatcher, localRefs)

    if (tView.queries !== null) {
        tView.queries.elementStart(tView, tNode);
    }

    return tNode;

}

export function resolveDirectives(
    tNode: TNode,
    tView: TView,
    lView: LView,
    matcher: (arg1: TView, arg2: TNode) => DirectiveDef<unknown>[] | null,
    localRefs: string[] | null
) {

    const exportsMap: Record<string, number> | null = localRefs === null ? null : {'': -1};
    const matchedDirectiveDefs = matcher ? matcher(tView, tNode) : findDirectiveDefMatches(tView, tNode)

    if (matchedDirectiveDefs !== null) {

        initializeDirectives(
            tView,
            lView,
            tNode,
            matchedDirectiveDefs,
            {},
        );

    }

    if (exportsMap !== null && localRefs !== null) {
        cacheMatchingLocalNames(tNode, localRefs, exportsMap);
    }

    return matchedDirectiveDefs;

}

function initializeDirectives(
    tView: TView,
    lView: LView,
    tNode: TNode,
    directives: DirectiveDef<unknown>[],
    exportsMap: {[key: string]: number} | null,
) {
    const directivesLength = directives.length;
    let componentDef: ComponentDef<unknown> | null = null;

    for (let i = 0; i < directivesLength; i++) {
        const def = directives[i];
        if (componentDef === null && isComponentDef(def)) {
            // componentDef = def;
            markAsComponentHost(tView, tNode, i);
        }
    }

    if (directivesLength > 0) {
        tNode.directiveToIndex = new Map();
    }

    (lView.directive_instances ??= []);
    (tView.directives ??= []);

    initTNodeFlags(tNode, tView.directives.length, directivesLength);

    let directiveIdx = allocExpando(tView, lView, directivesLength, null);

    for (let i = 0; i < directivesLength; i++) {
        const def = directives[i];

        if (def.hostBindings !== null /*|| def.hostAttrs !== null || def.hostVars !== 0*/)
            tNode.flags |= TNodeFlags.hasHostBindings;

        lView.directive_instances[directiveIdx] = def;
        tView.directives[directiveIdx] = def;

        directiveIdx++;

    }

    initializeInputAndOutputAliases(tView, tNode)//, hostDirectiveDefs);

}

function markAsComponentHost(tView: TView, hostTNode: TNode, componentOffset: number): void {
    hostTNode.componentOffset = componentOffset;
    (tView.components ??= []).push(hostTNode.index);
}

function initTNodeFlags(tNode: TNode, index: number, numberOfDirectives: number) {
    tNode.flags |= TNodeFlags.isDirectiveHost;
    tNode.directiveStart = index;
    tNode.directiveEnd = index + numberOfDirectives;
}

export function createDirectivesInstances(tNode: TNode, tView: TView, lView: LView) {

    instantiateAllDirectives(tView, lView, tNode);
    if ((tNode.flags & TNodeFlags.hasHostBindings) === TNodeFlags.hasHostBindings) {
        invokeDirectivesHostBindings(tView, lView, tNode);
    }

}

function instantiateAllDirectives(tView: TView, lView: LView, tNode: TNode) {

    const start = tNode.directiveStart;
    const end = tNode.directiveEnd;

    if (isComponentHost(tNode)) {

        const native = (lView.data[tNode.index]);

        const compInstance = null
        const compTView = getOrCreateComponentTView(tView.directives[start + tNode.componentOffset] as ComponentDef<any>)
        let compLView = createLView(lView, compTView, compInstance, null, native, null);
        lView.instances[tNode.index] = compLView;

    }

    for (let i = start; i < end; i++) {

        const def = tView.directives[i] as DirectiveDef<any>;
        const directiveInstance = def.type[NG_FACTORY_DEF]();
        lView.directive_instances[i] = directiveInstance;

        if (isComponentDef(def)) {
            const componentView = lView.instances[tNode.index];
            componentView.context = directiveInstance;
        }


    }

}

enum BindingType {
    Inputs,
    Outputs
}

function initializeInputAndOutputAliases(
    tView: TView,
    tNode: TNode,
    // hostDirectiveDefs: HostDirectiveDefs | null,
): void {
    for (let index = tNode.directiveStart; index < tNode.directiveEnd; index++) {
        const directiveDef = tView.directives[index] as DirectiveDef<any>;
        setupSelectorMatchedInputsOrOutputs(BindingType.Inputs, tNode, directiveDef, index);
        setupSelectorMatchedInputsOrOutputs(BindingType.Outputs, tNode, directiveDef, index);
        // setupInitialInputs(tNode, index, false);
    }
}

function setupSelectorMatchedInputsOrOutputs<T>(
    mode: BindingType,
    tNode: TNode,
    def: DirectiveDef<T>,
    directiveIndex: number,
): void {
    const aliasMap = mode === BindingType.Inputs ? def.inputs : def.outputs;

    for (const publicName in aliasMap) {
        if (aliasMap.hasOwnProperty(publicName)) {
            let bindings;
            if (mode === BindingType.Inputs) {
                bindings = tNode.inputs ??= {};
            } else {
                bindings = tNode.outputs ??= {};
            }
            bindings[publicName] ??= [];
            bindings[publicName].push(directiveIndex);
            // setShadowStylingInputFlags(tNode, publicName);
        }
    }
}

function cacheMatchingLocalNames(
    tNode: TNode,
    localRefs: string[],
    exportsMap: {[key: string]: number},
): void {
    const localNames: (string | number)[] = (tNode.localNames = []);

    for (let i = 0; i < localRefs.length; i += 2) {
        const index = exportsMap[localRefs[i + 1]];
        if (index == null)
            throw new Error(
                `Export of name '${localRefs[i + 1]}' not found!`,
            );
        localNames.push(localRefs[i], index);
    }
}
