import {
  ComponentDef,
  CssSelector, DirectiveDef,
  enterView,
  getComponentDef,
  leaveView,
  LView,
  runtime,
  TNodeType,
  TView,
  TViewType,
  Type
} from "./core";
import {DefaultDomRenderer2} from "./browser";
import {setupZone} from "./zone";
import {detectChanges, renderView} from "./change_detection";
import {createTView} from "./shared";
import {RenderFlags} from "./render_flags";
import {createDirectivesInstances, directiveHostFirstCreatePass} from "./directive";

class Application {
  bootstrap(component: any, rootSelectorOrNode?: string) {

    const factory = resolveComponentFactory(component);
    const selectorOrNode = rootSelectorOrNode || factory.selector;
    factory.create(selectorOrNode)

    return this;

  }
}

function locateHostElement(
  renderer,
  elementOrSelector,
  encapsulation,
  injector,
) {
  const preserveContent = true;
  const rootElement = renderer.selectRootElement(
    elementOrSelector,
    preserveContent,
  );
  return rootElement;
}

export function createElementNode(
  renderer: DefaultDomRenderer2,
  name: string,
  namespace: string | null,
): any {
  return renderer.createElement(name, namespace);
}

export async function bootstrapApplication(component: any): Promise<Application> {

  const appRef = new Application();
  return appRef.bootstrap(component)

}

function extractAttrsAndClassesFromSelector(selector: CssSelector) {
  return [];
}

function createRootTView(
    rootSelectorOrNode: any,
    componentDef: ComponentDef<unknown>,
    directives: (Type<unknown>)[] | undefined,
): TView {
  const tAttributes = rootSelectorOrNode
      ? ['mini-ng-version', '0.0.0-PLACEHOLDER']
      :  extractAttrsAndClassesFromSelector(componentDef.selectors[0]);
  let varsToAllocate = 0;

  const directivesToApply: DirectiveDef<unknown>[] = [componentDef];

  const rootTView = createTView(
      TViewType.Root,
      null,
      null,
      1,
      varsToAllocate,
      directivesToApply,
      null,
      null,
      [tAttributes],
      null
  );

  return rootTView;
}

function tick() {
  let rootLView = runtime.currentLView as LView;
  detectChanges(rootLView);
}

function resolveComponentFactory<T>(component: Type<T>): ComponentFactory<T> {
  const componentDef = getComponentDef(component)!;
  return new ComponentFactory(componentDef);
}

export class ComponentFactory<T> {
  selector: string;
  componentType: Type<any>;

  constructor(
      private componentDef: ComponentDef<any>
  ) {
    this.componentType = componentDef.type;
    this.selector = (componentDef.selectors).map(selector => {
      return selector.join()
    }).join();
  }

  create(
      rootSelectorOrNode?: any,
  ) {

    const cmpDef = this.componentDef;
    const elementName = cmpDef.selectors[0][0] as string || "div";

    const hostRenderer = new DefaultDomRenderer2(window.document);
    const hostElement = rootSelectorOrNode
        ? locateHostElement(
            hostRenderer,
            rootSelectorOrNode,
            null,
            null,
        )
        : createElementNode(hostRenderer, elementName, "") as HTMLElement;

    // we need to root TView
    const rootTView = createRootTView(rootSelectorOrNode, cmpDef, undefined);
    rootTView.template = cmpDef.template
    rootTView.consts = cmpDef.consts;
    rootTView.id = cmpDef.id;
    rootTView.viewQuery = cmpDef.viewQuery

    const id_value = "_nghost-" + rootTView.id;
    hostElement.setAttribute(id_value, id_value);

    hostElement.setAttribute("mini-ng-version", "0.0.0");

    const templateFn = rootTView.template

    const rootLView: LView = {
      flags: undefined,
      id: 0,
      tView: rootTView,
      data: [],
      instances: [],
      parent: null,
      host: hostElement,
      context: null,
      context_value: null,
      queries: null,
      declaration_view: null,
      declaration_component_view: null,
      t_host: null
    };

    const hostTNode = directiveHostFirstCreatePass(
        0,
        rootLView,
        TNodeType.Element,
        '#host',
        () => rootTView.directiveRegistry,
        true,
        0,
    );

    createDirectivesInstances(hostTNode, rootTView, rootLView);
    const componentInstance = rootLView.directive_instances[hostTNode.index]
    rootLView.context = componentInstance;

    if (cmpDef.dependencies.length > 0) {
      rootTView.directives.push(...cmpDef.tView.directives)
      rootTView.directiveRegistry.push(...cmpDef.tView.directiveRegistry)
    }

    rootTView.pipeRegistry = cmpDef.tView.pipeRegistry

    setupZone(() => {
      tick();
    });

    enterView(rootLView);

    // templateFn(RenderFlags.CREATE, componentInstance);
    //
    // rootTView.firstCreatePass = false;
    //
    // // First update pass
    // templateFn(RenderFlags.UPDATE, componentInstance);
    //
    // leaveView();

    renderView(rootTView, rootLView, componentInstance);

    // enterView(rootLView);

  }

}
