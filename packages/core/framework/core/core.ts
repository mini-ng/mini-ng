import {AttributeMarker} from "./attribute_marker";
import {RenderFlags} from "./render_flags";
import {LViewFlags, Writable} from "./type";
import {PipeDef} from "./pipe";

export class QueryMetadata {
  predicate
  constructor(predicate, public read, public flags) {
    this.predicate = predicate;
  }
}

export class QueryList<T> implements Iterable<T> {

  private _results: T[] = [];

  first!: T;
  last!: T;

  reset(values: T[]) {
    this._results = values;
    this.first = values[0];
    this.last = values[values.length - 1];
  }

  [Symbol.iterator](): Iterator<T> {
    return this._results[Symbol.iterator]();
  }
}

export interface LQuery<T> {}

export class LQuery_<T> implements LQuery<T> {
  matches: (T | null)[] | null = null;

  constructor(public queryList: QueryList<T>) {
  }
}

export interface LQueries {
  queries: LQuery<any>[];
}

export class LQueries_ implements LQueries {
  constructor(public queries: LQuery<any>[] = []) {
  }
}

export interface TQueries {
  elementStart(tView: TView, tNode: TNode): void;
  track(tQuery: TQuery_): void;
  getQueryByIndex(index: number): TQuery | null;
}

export class TQueries_ implements TQueries {

  constructor(private queries: TQuery[] = []) {}

  elementStart(tView: TView, tNode: TNode) {
    for (let i = 0; i < this.queries.length; i++) {
      const query = this.queries[i];
      query.elementStart(tView, tNode);
    }
  }

  track(tQuery: TQuery_) {
    this.queries.push(tQuery);
  }

  getQueryByIndex(index: number): TQuery | null {
    return this.queries[index];
  }

}

export interface TQuery {
  metadata: QueryMetadata;
  matches: number[] | null;
  elementStart(tView: TView, tNode: TNode): void;
}

export class TQuery_ implements TQuery {
  matches: number[] | null = null;
  metadata: QueryMetadata;

  constructor(metadata: QueryMetadata) {
    this.metadata = metadata;
  }

  elementStart(tView: TView, tNode: TNode) {
    // search through the TView and TNode

    if (this.metadata.predicate) {
      const predicate = this.metadata.predicate;
      if (typeof predicate === "string") {
        // search in tNode localNames
        const localNames = tNode.localNames
        if (localNames !== null) {

          for (let i = 0; i < localNames.length; i++) {

            if (localNames[i] === predicate) {
              (this.matches ??= []).push(tNode.index)
            }

            i++;
          }

        }

      }

    }
  }

}

export const enum TNodeFlags {
  isDirectiveHost = 1 << 0,
  isProjected = 1 << 1,
  hasContentQuery = 1 << 2,
  hasClassInput = 1 << 3,
  hasStyleInput = 1 << 4,
  isDetached = 1 << 5,
  hasHostBindings = 1 << 6,
  inSkipHydrationBlock = 1 << 7,
  isControlFlowStart = 1 << 8,
  isInControlFlow = 1 << 9,
  isFormValueControl = 1 << 10,
  isFormCheckboxControl = 1 << 11,
  isPassThroughControl = 1 << 12,
}

export interface PipeTransform {
  transform(value: any, ...args: any[]): any;
}

export type PipeDefList = PipeDef<any>[];
export type PipeDefListOrFactory = (() => PipeDefList) | PipeDefList;

export type TConstantsOrFactory = (AttributeMarker | string)[][] | (() => (AttributeMarker | string)[][]);

type DirectiveInputs<T> = { [P in keyof T]?: string | [flags: InputFlags, publicName: string, declaredName?: string | undefined, transform?: InputTransformFunction | undefined] | undefined; }
export type DirectiveDefListOrFactory = (() => DirectiveDefList) | DirectiveDefList;

export type DirectiveDefList = (DirectiveDef<any> | ComponentDef<any>)[];
export type HostBindingsFunction<T> = <U extends T>(rf: RenderFlags, ctx: U) => void;
export enum InputFlags {
  None = 0,
  SignalBased = 1 << 0,
  HasDecoratorInputTransform = 1 << 1,
}
export type InputTransformFunction = (value: any) => any;
export type CssSelectorList = CssSelector[];
export type CssSelector = (string | SelectorFlags)[];
export const enum SelectorFlags {
  NOT = 0b0001,
  ATTRIBUTE = 0b0010,
  ELEMENT = 0b0100,
  CLASS = 0b1000,
}

export interface DirectiveDef<T> {
  readonly inputs: Record<
      string,
      [minifiedName: string, flags: InputFlags, transform: InputTransformFunction | null]
  >;
  readonly declaredInputs: Record<string, string>;
  readonly outputs: Record<string, string>;
  readonly hostBindings: HostBindingsFunction<T> | null;
  readonly hostVars: number;
  readonly type: Type<T>;
  readonly selectors: CssSelectorList;
  readonly exportAs: string[] | null;
  readonly standalone: boolean;
  readonly signals: boolean;
  viewQuery: ViewQueriesFunction<T> | null;
}

export interface ComponentDef<T> extends DirectiveDef<T> {
  readonly id: string;
  readonly template: ComponentTemplate<T>;
  readonly consts: (AttributeMarker | string)[][] | null;
  readonly ngContentSelectors?: string[];
  readonly styles: string[];
  readonly decls: number;
  readonly vars: number;
  readonly data: {
    [kind: string]: any;
    animation?: any[];
  };
  readonly inputConfig: {
    [P in keyof T]?: string | [InputFlags, string, string?, InputTransformFunction?];
  };

  readonly onPush: boolean;
  readonly signals: boolean;
  directiveDefs: DirectiveDefListOrFactory | null;
  pipeDefs: PipeDefListOrFactory | null;
  dependencies: TypeOrFactory<DependencyTypeList> | null;
  tView: TView | null;
  getExternalStyles: ((encapsulationId?: string) => string[]) | null;
  readonly _?: unknown;
  viewQuery: ViewQueriesFunction<T> | null;
}

export type ComponentTemplate<T> = <U extends T>(rf: RenderFlags, ctx: T | U) => void

type TypeOrFactory<T> = T | (() => T)

export type DependencyType = DirectiveType<any> | ComponentType<any> | PipeType<any> | Type<any>;

export type DependencyTypeList = Array<DependencyType>;

export interface Type<T> extends Function {
  new (...args: any[]): T;
}

export interface ComponentType<T> extends Type<T> {
  ɵcmp: unknown;
}

export interface DirectiveType<T> extends Type<T> {
  ɵdir: unknown;
  ɵfac: unknown;
}

export interface PipeType<T> extends Type<T> {
  ɵpipe: unknown;
}

export type ViewQueriesFunction<T> = <U extends T>(rf: RenderFlags, ctx: U) => void;
export type ContentQueriesFunction<T> = <U extends T>(rf: RenderFlags, ctx: U) => void;

interface DirectiveDefinition<T> {
  type: Type<T>;
  selectors?: CssSelectorList;
  inputs?: DirectiveInputs<T>;
  outputs?: {[P in keyof T]?: string};
  hostBindings?: HostBindingsFunction<T>;
  hostVars?: number;
  exportAs?: string[];
  signals?: boolean;
  declaredInputs: Record<string, string>;
  contentQueries?: ContentQueriesFunction<T>;
  viewQuery?: ViewQueriesFunction<T> | null;
}

interface ComponentDefinition<T> extends DirectiveDefinition<T> {
  decls: number;
  vars: number;
  template: ComponentTemplate<T>;
  consts?: TConstantsOrFactory;
  dependencies?: TypeOrFactory<DependencyTypeList>;
  styles?: string[];
  data?: {[kind: string]: any};
  viewQuery: ViewQueriesFunction<T> | null;
}

export type Element = HTMLElement | Text | SVGElement | Comment;
type TemplateFn = (RenderFlags, any) => void;
export interface Type<T> extends Function {
  new (...args: any[]): T;
}

export const enum TNodeType {
  Text = 0b1,
  Element = 0b10,
  Container = 0b100,
  ElementContainer = 0b1000,
  Projection = 0b10000,
  Icu = 0b100000,
  Placeholder = 0b1000000,

  LetDeclaration = 0b10000000,

  ControlDirective = 0b100000000,
  AnyRNode = 0b11, // Text | Element
  AnyContainer = 0b1100, // Container | ElementContainer
}

export type TData = (number | TNode | PipeDef<any>)[]

export enum TViewType {
  Root,
  Component,
  Embedded
}

export type TView = {
  type: TViewType;
  blueprint: any[];
  firstCreatePass: boolean;
  template: TemplateFn;
  directiveRegistry: any[];
  pipeRegistry: any[];
  consts: any[][];
  styles: string[];
  id: string;
  data: TData;
  components: number[] | null;
  directives?: DirectiveDef<any>[];
  queries: TQueries | null;
  viewQuery: ViewQueriesFunction<{}> | null;
};

export interface LView {
  tView: TView;
  data: Element[]; // array of child HTMLElement | Text nodes
  instances: LView[]; // array of child LViews
  parent: LView | null; // parent of this LView
  host: Element; // HTMLElement or Text node of this LView
  context: any; // class instance of this LView

  context_value: any | null;
  queries: LQueries,
  flags: LViewFlags,
  id: number,
  directive_instances?: any[]
  pipe_instances?: PipeTransform[]
}

type NodeOutputBindings = {
  [x: string]: number[];
}

type NodeInputBindings = {
  [x: string]: number[];
}

export type TAttributes = (string | AttributeMarker | CssSelector)[]

export type TNode = {
  directiveToIndex?: Map<Type<any>, number>;
  directiveStart: number;
  directiveEnd: number;
  type: TNodeType;
  index: number;
  value: any;
  tView: TView | null;
  parent: TNode | null;
  attrs: TAttributes | null;
  styles: string | null;
  classes: string | null;
  localNames: (string | number)[] | null;
  inputs: NodeInputBindings | null;
  outputs: NodeOutputBindings | null;
  flags: TNodeFlags;
  componentOffset: number;
};

export interface LContainer extends LView {}

export enum NameSpace {
  None,
  SvgNameSpace
}

export type LRuntime = {
  currentLView: LView;
  currentTNode: TNode;
  parent: LRuntime | null;
  selectedIndex: number;
  currentNamespace: NameSpace;
  isParent: boolean;
};

export let runtime: LRuntime = {
  currentLView: null as LView | null,
  currentTNode: null,
  parent: null,
  selectedIndex: -1,
  currentNamespace: NameSpace.None,
  isParent: true,
};

export function enterView(lView: LView) {

  const newRuntime = {
    currentLView: lView,
    currentTNode: null,
    parent: runtime,
    selectedIndex: -1,
    currentNamespace: NameSpace.None,
    isParent: true,
  };

  runtime = newRuntime;
}

export function leaveView() {

  runtime = runtime.parent;

}

export function getTNode(tView: TView, index: number) {
  const tNode = tView.data[index]
  return tNode;
}

export function getSelectedTNode() {
  const lFrame = runtime;
  return getTNode(lFrame.currentLView.tView, lFrame.selectedIndex);
}

export function ɵɵadvance(delta: number = 1) {
  runtime.selectedIndex = delta;
}

export function getDefinition<T>(def: DirectiveDefinition<any>) : DirectiveDef<T> {
  const directiveDefinition = def;
  const declaredInputs: Record<string, string> = {};

  return {
    signals: false,
    standalone: false,
    type: directiveDefinition.type,
    hostBindings: directiveDefinition.hostBindings  || null,
    declaredInputs,
    // @ts-ignore
    inputConfig: directiveDefinition.inputs || EMPTY_OBJ,
    exportAs: [],
    hostVars: 0,
    inputs: parseAndConvertInputsForDefinition((directiveDefinition as unknown as DirectiveDefinition<T>).inputs, declaredInputs),
    outputs: parseAndConvertOutputsForDefinition((directiveDefinition as unknown as DirectiveDefinition<T>).outputs),
    selectors: (directiveDefinition as unknown as DirectiveDefinition<T>).selectors,
    viewQuery: directiveDefinition.viewQuery || null,
    contentQueries: directiveDefinition.contentQueries || null,
  }
}

export function ɵɵdefineComponent<T>(componentDefinition: ComponentDefinition<T>): ComponentDef<T> {

  const dirDef = getDefinition(componentDefinition  as DirectiveDefinition<any>);

  // @ts-ignore
  const def: Writable<ComponentDef<T>> = {
    ...dirDef,
    onPush: false,
    id: "",
    getExternalStyles: null,
    directiveDefs: null,
    data: componentDefinition.data,
    consts: typeof componentDefinition.consts === "function" ? componentDefinition.consts() : componentDefinition.consts,
    dependencies: (componentDefinition).dependencies,
    decls: componentDefinition.decls,
    vars: componentDefinition.vars,
    styles: componentDefinition.styles,
    tView: null,
    template: componentDefinition.template,
    pipeDefs: null!,
  }

  def.id = getComponentId(def);
  const dependencies = componentDefinition.dependencies;
  def.directiveDefs = extractDefListOrFactory(dependencies, extractDirectiveDef);
  def.pipeDefs = extractDefListOrFactory(dependencies, getPipeDef);

  return def;
}

export function getComponentId<T>(componentDef: any): string {

  let hash = 0;

  const hashSelectors = [
    componentDef.selectors,
  ];

  for (const char of hashSelectors.join('|')) {
    hash = (Math.imul(31, hash) + char.charCodeAt(0)) << 0;
  }

  hash += 2147483647 + 1;

  const compId = 'c' + hash;

  return compId;

}

export function extractDefListOrFactory<T>(
    dependencies: TypeOrFactory<DependencyTypeList> | undefined,
    defExtractor: (type: Type<unknown>) => T | null,
): (() => T[]) | T[] | null {
  if (!dependencies) {
    return null;
  }

  return () => {
    const resolvedDependencies = typeof dependencies === 'function' ? dependencies() : dependencies;
    const result: T[] = [];

    for (const dep of resolvedDependencies) {
      const definition = defExtractor(dep);
      if (definition !== null) {
        result.push(definition);
      }
    }

    return result;
  };
}

export function extractDirectiveDef(type: Type<any>): DirectiveDef<any> | ComponentDef<any> | null {
  return getComponentDef(type) || getDirectiveDef(type);
}

export function getComponentDef<T>(type: any): ComponentDef<T> | null {
  const NG_COMP_DEF = "ɵcmp";
  return type[NG_COMP_DEF] || null;
}

export function getDirectiveDef<T>(type: any): DirectiveDef<T> | null {
  const NG_DIR_DEF = "ɵdir";
  return type[NG_DIR_DEF] || null;
}

function convertDirectiveInputs<T>(
    inputs: DirectiveInputs<T>
): Record<string, [minifiedName: string, flags: InputFlags, transform: InputTransformFunction]> {
  const result: Record<
      string,
      [minifiedName: string, flags: InputFlags, transform: InputTransformFunction]
  > = {};

  for (const minifiedName in inputs) {
    const value = inputs[minifiedName];
    if (!value) continue;

    // Case 1: string form
    if (typeof value === 'string') {
      result[value] = [minifiedName, 0, undefined];
      continue;
    }

    // Case 2: tuple form
    const [flags, publicName, _declaredName, transform] = value;

    result[publicName] = [
      minifiedName,
      flags ?? 0,
      transform ?? undefined,
    ];
  }

  return result;
}

export const EMPTY_OBJ = {}

function parseAndConvertInputsForDefinition<T>(
    obj: DirectiveDefinition<T>['inputs'],
    declaredInputs: Record<string, string>,
) {
  if (obj == null) return EMPTY_OBJ as any;
  const newLookup: Record<
      string,
      [minifiedName: string, flags: InputFlags, transform: InputTransformFunction | null]
  > = {};
  for (const minifiedKey in obj) {
    if (obj.hasOwnProperty(minifiedKey)) {
      const value = obj[minifiedKey]!;
      let publicName: string;
      let declaredName: string;
      let inputFlags: InputFlags;
      let transform: InputTransformFunction | null;

      if (Array.isArray(value)) {
        inputFlags = value[0];
        publicName = value[1];
        declaredName = value[2] ?? publicName; // declared name might not be set to save bytes.
        transform = value[3] || null;
      } else {
        publicName = value;
        declaredName = value;
        inputFlags = InputFlags.None;
        transform = null;
      }

      newLookup[publicName] = [minifiedKey, inputFlags, transform];
      declaredInputs[publicName] = declaredName as string;
    }
  }
  return newLookup;
}

function parseAndConvertOutputsForDefinition<T>(
    obj: DirectiveDefinition<T>['outputs'],
): Record<keyof T, string> {
  if (obj == null) return EMPTY_OBJ as any;
  const newLookup: any = {};
  for (const minifiedKey in obj) {
    if (obj.hasOwnProperty(minifiedKey)) {
      newLookup[obj[minifiedKey]!] = minifiedKey;
    }
  }
  return newLookup;
}

function getPipeDef<T>(type: any): PipeDef<T> | null {
  const NG_PIPE_DEF = "ɵpipe";
  return type[NG_PIPE_DEF] || null;
}
