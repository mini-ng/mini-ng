import {TemplateRef} from "./TemplateRef";
import {getCurrentTNode, getLView} from "../core/state";
import {LView, TNode} from "../core";

export class ViewContainerRef {

    constructor(
        private _lContainer: LView,
        private _hostTNode: TNode,
        private _hostLView: LView,
    ) {
    }

    createEmbeddedView(templateRef: TemplateRef<any>) {

    }

    clear() {

    }

    static __NG_ELEMENT_ID__: () => ViewContainerRef = injectViewContainerRef;

}

export function injectViewContainerRef(): ViewContainerRef {
    const previousTNode = getCurrentTNode() as TNode;
    return createContainerRef(previousTNode, getLView());
}

function createContainerRef(previousTNode: TNode, lView: LView) {
    const hostLView = lView.instances[previousTNode.index];
    return new ViewContainerRef(hostLView, previousTNode, lView);
}
