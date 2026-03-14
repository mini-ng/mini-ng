import {LView, runtime, TNode, TView, Element} from "./core";

export function setCurrentTNode(tNode: TNode | null, isParent: boolean) {
    const lFrame = runtime;
    lFrame.currentTNode = tNode;
    lFrame.isParent = isParent;
}

export function getCurrentParentTNode(): TNode | null {
    const lFrame = runtime;
    const currentTNode = lFrame.currentTNode;
    return lFrame.isParent ? currentTNode : currentTNode!.parent;
}

export function isCurrentTNodeParent(): boolean {
    return runtime.isParent;
}

export function setCurrentTNodeAsNotParent(): void {
    runtime.isParent = false;
}

export function getCurrentTNode() {
return runtime.currentTNode
}

export function createLView<T>(
    parentLView: LView | null,
    tView: TView,
    context: T | null,
    host: Element | null,
    tHostNode: TNode | null) {

    const lView: LView = {
        context,
        data: [],
        host,
        instances: [],
        parent: parentLView,
        tView: tView,
        context_value: null,
        queries: null,
        flags: null,
        id: null,
        declaration_view: null,
        declaration_component_view: null,
        t_host: null,
    }
    return lView;
}

export function getLView<T>(): LView {
    return runtime.currentLView as LView;
}

export function getTView(): TView {
    return runtime.currentLView.tView as TView;
}

export function getSelectedIndex() {
    return runtime.selectedIndex;
}

// export function createLContainer(
//     hostNative: RElement | RComment | LView,
//     currentView: LView,
//     native: RComment,
//     tNode: TNode,
// ): LContainer {
//
//     const lContainer: LContainer = [
//         hostNative, // host native
//         true, // Boolean `true` in this position signifies that this is an `LContainer`
//         0, // flags
//         currentView, // parent
//         null, // next
//         tNode, // t_host
//         null, // dehydrated views
//         native, // native,
//         null, // view refs
//         null, // moved views
//     ];
//
//     return lContainer;
// }

