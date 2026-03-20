import {CssSelectorList, TNode} from "../core";
import {getLView} from "../state";
import {isNodeMatchingSelectorList} from "../shared";

export function ɵɵprojectionDef(projectionSlots?: (CssSelectorList | "*")[]) {

    const lView = getLView()

    const componentTNode = lView.declaration_component_view.t_host

    if (componentTNode.projection) return

    const heads: (TNode | null)[] = (componentTNode.projection = new Array(projectionSlots.length) as (TNode | null)[]);
    const tails: (TNode | null)[] = heads.slice();

    let componentChild: TNode | null = componentTNode.child;

    while (componentChild !== null) {
        // if componentChild matches a projection

        const slotIndex = matchingProjectionSlotIndex(projectionSlots, componentChild)

        componentTNode.projection[slotIndex] = componentChild

        componentChild = componentChild.next;
    }

}

function matchingProjectionSlotIndex(projectionSlots: (CssSelectorList | "*")[], tNode: TNode) {

    let wildCardIndex = null;

    for (let i = 0; i < projectionSlots.length; i++) {

        const projectionSlot = projectionSlots[i];

        if (projectionSlot === "*") {
            wildCardIndex = i;
            continue
        }

        // if (
        //     ngProjectAsAttrVal === null
        //         ? isNodeMatchingSelectorList(tNode, projectionSlot, /* isProjectionMode */ true)
        //         : isSelectorInSelectorList(ngProjectAsAttrVal, slotValue)
        // ) {
        //     return i;
        // }

    }

    return wildCardIndex;

}
