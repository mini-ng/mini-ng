import {DirectiveDef, LView, TNode, TView} from "../core";
import {RenderFlags} from "../render_flags";

export function executeContentQueries(tView: TView, tNode: TNode, lView: LView) {
    // if (isContentQueryHost(tNode)) {
    //     try {
    //         const start = tNode.directiveStart;
    //         const end = tNode.directiveEnd;
    //         for (let directiveIndex = start; directiveIndex < end; directiveIndex++) {
    //             const def = tView.data[directiveIndex] as DirectiveDef<any>;
    //             if (def.contentQueries) {
    //                 const directiveInstance = lView[directiveIndex];
    //                 def.contentQueries(RenderFlags.Create, directiveInstance, directiveIndex);
    //             }
    //         }
    //     } finally {
    //     }
    // }
}
