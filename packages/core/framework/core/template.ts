import {enterView, leaveView, LView, runtime, TNode, TNodeType, TView, TViewType} from "./core";
import {appendChild} from "./element";
import {createLView, getLView, getSelectedIndex, getTView, setCurrentTNode} from "./state";
import {RenderFlags} from "./render_flags";
import {cloneObject} from "./utils";
import {createTNode} from "./shared";

export function ɵɵtemplate<T>(
    index: number,
    templateFn: () => void,
    tagName: string,
    consts: any[][],
    attrsIndex?: number
) {

    const declarationLView = getLView()
    const declarationTView = declarationLView.tView;
    // create TView

    const attrs = declarationTView.consts[attrsIndex];

    const embeddedTView: TView = {
        blueprint: new Array(9).fill(null),
        firstCreatePass: true,
        template: templateFn,
        directiveRegistry: declarationTView.directiveRegistry,
        pipeRegistry: declarationTView.pipeRegistry,
        consts: consts,
        styles: declarationTView.styles,
        id: declarationTView.id, // index.toString(),
        type: TViewType.Embedded,
        data: [],
        components: declarationTView.components,
    }

    const parentTNode = runtime.isParent ? runtime.currentTNode : runtime.currentTNode.parent
    const tNode: TNode = createTNode(index, tagName, TNodeType.Container, embeddedTView, parentTNode, attrs);
    declarationTView.data[index] = tNode;

    // create comment
    const comment = document.createComment(tagName)
    declarationLView.data[index] = comment;
    // set node in runtime

    setCurrentTNode(tNode, false)

    const context = declarationLView.context;

    const embeddedLView = createLView<T>(
        declarationLView,
        embeddedTView,
        context,
        null,
        tNode
    );

    declarationLView.instances[index] = embeddedLView;

    appendChild(comment, declarationLView, declarationTView, tNode.parent);

}

//  containerIndex: number, matchingTemplateIndex: number,
export function ɵɵconditional<T>(containerIndex: number, containerEndIndex: number, matchingTemplateIndex: number) {

    // advance has set the currentTNode as the comment

    if (matchingTemplateIndex !== -1) {

        const lView = getLView()
        const tNode = lView.tView.data[matchingTemplateIndex] as TNode;
        const comment = lView.data[matchingTemplateIndex];
        const embeddedTView = tNode.tView

        for (let i = containerIndex; i <= containerEndIndex; i++) {
            const currentLView = lView.instances[i]
            if (currentLView) {
                clearContainer(currentLView);
            }
            lView.instances[i] = null;
        }

        // get and call the template
        const templateFn = tNode.tView.template;

        const context = lView.context;
        const RenderFlag = RenderFlags.CREATE;

        // we will need to create an embedded LView which will pass to enterView
        const embeddedLView = createLView<T>(
            lView,
            embeddedTView,
            context,
            null,
            tNode
        );

        embeddedLView.host = comment;
        lView.instances[matchingTemplateIndex] = embeddedLView;

        enterView(embeddedLView)

        templateFn(context, RenderFlag);

        leaveView()

    }

}

function clearContainer(templateLView: LView) {
    if (templateLView.data.length > 0) {
        [...templateLView.data].reverse().forEach(el => {
            // we know els are siblings inserted before the lView host
            if (el && el.parentElement) {
                el.parentElement.removeChild(el);
            }

        })

    }
}

export function ɵɵrepeaterCreate<T>(
    index: number,
    templateFn: () => void,
    decls: number,
    vars: number,
    tagName: string | null,
    attrsIndex: number | null,
    trackByFn: () => void,
    trackByUsesComponentInstance?: boolean,
    emptyTemplateFn?: () => void,
    emptyDecls?: number,
    emptyVars?: number,
    emptyTagName?: string | null,
    emptyAttrsIndex?: number | null): void {

    const lView = getLView()
    const tView = getTView()

    const forIndex = index;
    const emptyIndex = index + 1

    // create TView
    const embeddedTView: TView = {
        blueprint: new Array(9).fill(null),
        firstCreatePass: true,
        template: templateFn,
        directiveRegistry: tView.directiveRegistry,
        pipeRegistry: tView.pipeRegistry,
        consts: tView.consts,
        styles: tView.styles,
        id: tView.id,
        type: TViewType.Embedded,
        data: [],
        components: tView.components,
    }

    const attrs = tView.consts[attrsIndex]

    const parentTNode = runtime.isParent ? runtime.currentTNode : runtime.currentTNode.parent
    const tNode: TNode = createTNode(forIndex, tagName, TNodeType.Container, embeddedTView, parentTNode, attrs);
    tView.data[forIndex] = tNode;

    // create comment
    const comment = document.createComment(tagName)
    lView.data[forIndex] = comment;
    // set node in runtime

    setCurrentTNode(tNode, false)

    const context = lView.context;

    const embeddedLView = createLView<T>(
        lView,
        embeddedTView,
        context,
        null,
        tNode
    );
    embeddedLView.context_value = {
        hasEmptyBlock: !!emptyTemplateFn,
        trackByFn
    }

    lView.instances[forIndex] = embeddedLView;

    appendChild(comment, lView, tView, tNode.parent);

    if (emptyTemplateFn) {
        repeaterForEmpty(lView, tView, emptyIndex, emptyTagName, emptyTemplateFn)
    }

}

function repeaterForEmpty<T>(
    lView: LView,
    tView: TView,
    index: number,
    tagName: string | null,
    templateFn: () => void,
) {

    // create TView
    const embeddedTView: TView = {
        blueprint: new Array(9).fill(null),
        firstCreatePass: true,
        template: templateFn,
        directiveRegistry: tView.directiveRegistry,
        pipeRegistry: tView.pipeRegistry,
        consts: tView.consts,
        styles: tView.styles,
        id: tView.id,
        type: TViewType.Embedded,
        data: [],
        components: tView.components,
    }

    const parentTNode = runtime.isParent ? runtime.currentTNode : runtime.currentTNode.parent
    const tNode: TNode = createTNode(index, tagName, TNodeType.Container, embeddedTView, parentTNode, null);
    tView.data[index] = tNode;

    // create comment
    const comment = document.createComment(tagName)
    lView.data[index] = comment;
    // set node in runtime

    setCurrentTNode(tNode, false)

    const context = lView.context;

    const embeddedLView = createLView<T>(
        lView,
        embeddedTView,
        context,
        null,
        tNode
    );

    lView.instances[index] = embeddedLView;

    appendChild(comment, lView, tView, tNode.parent);

}

export function ɵɵrepeater(iterable: Array<any>) {
    const hostLView = getLView();
    const metadataSlotIdx = getSelectedIndex();

    const hostTView = hostLView.tView;
    const metadata = hostLView[metadataSlotIdx];
    const containerIndex = metadataSlotIdx + 1;

    const currentLView = hostLView.instances[metadataSlotIdx]

    if (currentLView) {
        currentLView.instances.forEach(instance => {
            clearContainer(instance);
        })
    }

    // get and call the template
    const tNode = hostLView.tView.data[metadataSlotIdx] as TNode;
    const templateFn = tNode.tView.template;
    const comment = hostLView.data[metadataSlotIdx];
    const embeddedTView = tNode.tView

    if (!iterable || iterable.length == 0) {
        // get the context_value
        const ctx_value = currentLView.context_value

        if (ctx_value && ctx_value.hasEmptyBlock) {

            const context = hostLView.context;

            const emptyBlockLView = hostLView.instances[metadataSlotIdx + 1]
            const emptyBlockTView = emptyBlockLView.tView;
            const emptyBlockTemplateFn = emptyBlockTView.template
            const comment = hostLView.data[metadataSlotIdx + 1];
            const tNode = hostLView.tView.data[metadataSlotIdx + 1] as TNode;

            clearContainer(emptyBlockLView);

            const embeddedLView = createLView(
                hostLView,
                emptyBlockTView,
                context,
                null,
                tNode
            );

            embeddedLView.host = comment;
            hostLView.instances[metadataSlotIdx + 1] = embeddedLView;

            enterView(embeddedLView)

            emptyBlockTemplateFn(context, RenderFlags.CREATE);
            emptyBlockTemplateFn(context, RenderFlags.UPDATE);

            leaveView()

        }

    }

    iterable.forEach((el, i) => {

        const context = cloneObject(hostLView.context);
        context.$implicit = el;

        // we will need to create an embedded LView which will pass to enterView
        const embeddedLView = createLView(
            currentLView,
            currentLView.tView,
            context,
            null,
            tNode
        );

        embeddedLView.host = comment;
        currentLView.instances[i] = embeddedLView;

        enterView(embeddedLView)

        templateFn(context, RenderFlags.CREATE);
        templateFn(context, RenderFlags.UPDATE);

        leaveView()


    })

}

export function ɵɵpipeBind1() {}
