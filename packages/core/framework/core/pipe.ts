import {LView, PipeTransform, TView, Type} from "./core";
import {getLView, getTView} from "./state";
import {getFactoryDef} from "./shared";

export type FactoryFn<T> = {
        <U extends T>(t?: Type<U>): U;
    (t?: undefined): T;
};

export interface PipeDef<T> {
    type: Type<T>;
    readonly name: string;
    factory: FactoryFn<T> | null;
    onDestroy: (() => void) | null;
}

export function ɵɵdefinePipe<T>(pipeDef: {
    name: string;
    type: Type<T>;
}) {
    return <PipeDef<T>>{
        type: pipeDef.type,
        name: pipeDef.name,
        factory: null,
        onDestroy: pipeDef.type.prototype.ngOnDestroy || null,
    };
}

export function ɵɵpipe(index: number, pipeName: string): any {

    const tView = getTView();
    let pipeDef: PipeDef<any>;

    if (tView.firstCreatePass) {

        pipeDef = tView.pipeRegistry.find(registry => registry.name === pipeName);
        tView.data[index] = pipeDef;

    } else {
        pipeDef = tView.data[index] as PipeDef<any>;
    }

    const pipeFactory = pipeDef.factory || (pipeDef.factory = getFactoryDef(pipeDef.type, true));

    const pipeInstance = pipeFactory();

    store(tView, getLView(), index, pipeInstance);

    return pipeInstance;

}

function store<T>(tView: TView, lView: LView, index: number, pipeInstance: PipeTransform) {
    (lView.pipe_instances ??= [])[index] = pipeInstance
}

export function ɵɵpipeBind(
    index: number,
    offset: number,
    v1: any
) {
    const lView = getLView();

    function load<T>(lView: LView, index: any) {
        return lView.pipe_instances[index];
    }

    const pipeInstance = load<PipeTransform>(lView, index);

    return pipeInstance?.transform(v1);

}
