import {
    DirectiveDef, LQueries_, LQuery_,
    LView,
    QueryList,
    QueryMetadata,
    TNode,
    TQueries_,
    TQuery_,
    TView,
    ViewQueriesFunction
} from "../core";
import {RenderFlags} from "../render_flags";
import {getLView, getTView} from "../state";

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

export function executeViewQueryFn<T>(
    flags: RenderFlags,
    viewQueryFn: ViewQueriesFunction<T>,
    component: T,
): void {
    // setCurrentQueryIndex(0);
    try {
        viewQueryFn(flags, component);
    } finally {

    }
}

enum QueryFlags {
    isStatic,
    emitDistinctChangesOnly
}

export function ɵɵviewQuery<T>(
    predicate: any | string | string[],
    flags: QueryFlags,
    read?: any
) {

    const tView = getTView();
    const lView = getLView();

    const queryMetaData = new QueryMetadata(predicate, flags, read);

    (tView.queries ??= new TQueries_());
    tView.queries.track(new TQuery_(queryMetaData))

    const queryList = new QueryList<T>(
        // (flags & QueryFlags.emitDistinctChangesOnly) === QueryFlags.emitDistinctChangesOnly,
    );

    const lQueries = (lView.queries ??= new LQueries_()).queries;
    return lQueries.push(new LQuery_(queryList)) - 1;

}

function getCurrentQueryIndex() {

}

export function ɵɵloadQuery<T>(): QueryList<T> {
    const lView = getLView()

    const queryIndex = getCurrentQueryIndex();
    return lView!.queries[queryIndex].queryList;

}

export function ɵɵqueryRefresh(queryList: QueryList<any>): boolean {
}
