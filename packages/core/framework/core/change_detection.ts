import { enterView, leaveView, LView, TNode, TView } from "./core";
import { processHostBindingOpCodes} from "./shared";
import {RenderFlags} from "./render_flags";

export function renderView(tView: TView, lView: LView, ctx: any) {

    const templateFn = tView.template

    enterView(lView);

    // const viewQuery = tView.viewQuery;
    // if (viewQuery !== null) {
    //     executeViewQueryFn<T>(RenderFlags.Create, viewQuery, context);
    // }


    if (tView.firstCreatePass) {
        templateFn(RenderFlags.CREATE | RenderFlags.UPDATE, ctx);
        tView.firstCreatePass = false;
    } else {
        templateFn(RenderFlags.UPDATE, ctx);
    }

    leaveView();
}

export function detectChanges(lView: LView) {
    refreshView(lView);

    for (const child of lView.instances) {
        if (!child) continue
        detectChanges(child);
    }
}

function refreshView(lView: LView) {
    const tView = lView.tView;
    const template = tView.template;

    enterView(lView)

    template(RenderFlags.UPDATE, lView.context);

    // update directives
    for (let i = 0; i < tView.data.length; i++) {
        const tNode = tView.data[i] as TNode;
        if (!tNode) continue;
        processHostBindingOpCodes(tView, lView, tNode);
    }

    leaveView();

}

