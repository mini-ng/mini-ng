import {DirectiveDef, runtime, TNode} from "./core";
import {getLView, getSelectedIndex, getTView} from "./state";
import {getNativeByTNode, isComponentHost, markDirtyIfOnPush} from "./shared";

// i0.ɵɵproperty("bind", ctx.name);
export function ɵɵproperty<T>(
    propName: string,
    value: T,
) {
    const lView = runtime.currentLView!;
    const tView = lView.tView;
    const tNode = tView.data[runtime.selectedIndex] as TNode

    const inputs = tNode.inputs?.[propName];
    
    // if (tNode.directiveStart > -1) {
    //
    //     const start = tNode.directiveStart;
    //     const end = tNode.directiveEnd;
    //
    //     for (let i = start; i < end; i++) {
    //         const directive_instance = lView.directive_instances[i];
    //         const def = tView.directives[i];
    //         const [privateName, flags, transform] = def.inputs[propName]
    //
    //         if (flags === InputFlags.HasDecoratorInputTransform) {
    //             value = transform.call(directive_instance, value);
    //         }
    //
    //         directive_instance[privateName] = value;
    //     }
    //
    // }

    if (inputs) {
        for (const index of inputs) {

            const instance = lView.directive_instances[index];
            const def = tView.directives[index] as DirectiveDef<any>;
            writeToDirectiveInput(def, instance, propName, value);

        }
    }

    isComponentHost(tNode) && markDirtyIfOnPush(lView, tNode.index);

    lView.data[tNode.index][propName] = value;

    // if (isDirectiveHost(tNode)) {
    //
    //     const childLView = lView.instances[runtime.selectedIndex];
    //     childLView.context[propName] = value as string;
    //
    //     enterView(childLView);
    //     childLView.tView.template(RenderFlags.UPDATE, childLView.context);
    //     leaveView()
    // }

    // propName = mapPropName(propName);
    // setDomProperty(tNode, lView, propName, value, renderer, sanitizer);

}

export function writeToDirectiveInput<T>(
    def: DirectiveDef<T>,
    instance: T,
    publicName: string,
    value: unknown,
) {

    const [privateName, flags, transform] = def.inputs[publicName];

    if (transform !== null) {
        value = transform.call(instance, value);
    }

    applyValueToInputField(instance, privateName, value);

}

export function applyValueToInputField<T>(
    instance: T,
    privateName: string,
    value: unknown,
) {

    (instance as any)[privateName] = value;

}

export function ɵɵclassProp(
    className: string,
    value: boolean | undefined | null,
) {

    checkStylingProperty(className, value, null, true);

}

export function ɵɵstyleProp(
    prop: string,
    value: string | number | undefined | null,
    suffix?: string | null,
) {

    checkStylingProperty(prop, value, suffix, false);

}

export function ɵɵattribute(
    className: string,
    value: any,
) {

    const lView = getLView();
    const tView = getTView();
    const index = getSelectedIndex();

    const tNode = tView.data[index] as TNode

    const el = getNativeByTNode(tNode, lView) as HTMLElement

    el.removeAttribute(className)
    el.setAttribute(className, value)

}

function checkStylingProperty(
    prop: string,
    value: any,
    suffix: string | undefined | null,
    isClassBased: boolean,
) {
    const lView = getLView();
    const tView = getTView();
    const index = getSelectedIndex();

    const tNode = tView.data[index] as TNode

    const el = getNativeByTNode(tNode, lView) as HTMLElement

    if (isClassBased) {
        if (!value) {
            el.classList.remove(prop);
        } else {
            el.classList.add(prop);
        }
    } else {
        el.style.setProperty(prop, value)
    }

}
