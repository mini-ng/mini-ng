import {
    DirectiveDef, LQueries_, LQuery_,
    LView,
    QueryList,
    QueryMetadata,
    TNode, TNodeType,
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

export function ɵɵloadQuery<T>(queryIndex: number): QueryList<T> {
    const lView = getLView()

    // const queryIndex = getCurrentQueryIndex();
    return lView!.queries.queries[queryIndex].queryList;

}

export function ɵɵqueryRefresh<T>(queryList: QueryList<any>, queryIndex: number): boolean {
    const lView = getLView();
    const tView = getTView();

    const lQuery = lView!.queries.queries![queryIndex];
    const tQuery = tView.queries.getQueryByIndex(queryIndex);

    const matches = tQuery.matches
    const result: Array<T | null> = [];

    if (matches === null) {
        queryList.reset([])
    } else {
        // get the matches
        for (let i = 0; i < matches.length; i++) {
            const matchedNodeIdx = matches[i];
            const matchedTNode = tView.data[matchedNodeIdx] as TNode

            if (matchedTNode.type && TNodeType.Element) {
                result.push(lView.data[matchedNodeIdx] as any)
            }

        }
        queryList.reset(result)
    }

    lQuery.matches = result
    return true

}
