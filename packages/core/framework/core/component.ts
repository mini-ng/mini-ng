interface Type<T> {}
const ANNOTATIONS = "__annotations__";
const PROP_METADATA = "__prop__metadata__";

export interface TypeDecorator {
        <T extends Type<any>>(type: T): T;

    (target: Object, propertyKey?: string | symbol, parameterIndex?: number): void;
    (target: unknown, context: unknown): void;
}

export function noSideEffects<T>(fn: () => T): T {
    return {toString: fn}.toString() as unknown as T;
}

function makeMetadataCtor(props?: (...args: any[]) => any): any {
    return function ctor(this: any, ...args: any[]) {
        if (props) {
            const values = props(...args);
            for (const propName in values) {
                this[propName] = values[propName];
            }
        }
    };
}

export function makeDecorator<T>(
    name: string,
    props?: (...args: any[]) => any,
    parentClass?: any,
    additionalProcessing?: (type: Type<T>) => void,
    typeFn?: (type: Type<T>, ...args: any[]) => void,
): {new (...args: any[]): any; (...args: any[]): any; (...args: any[]): (cls: any) => any} {
    return noSideEffects(() => {
        const metaCtor = makeMetadataCtor(props);

        function DecoratorFactory(
            this: unknown | typeof DecoratorFactory,
            ...args: any[]
        ): (cls: Type<T>) => any {
            if (this instanceof DecoratorFactory) {
                metaCtor.call(this, ...args);
                return this as typeof DecoratorFactory;
            }

            const annotationInstance = new (DecoratorFactory as any)(...args);
            return function TypeDecorator(cls: Type<T>) {
                if (typeFn) typeFn(cls, ...args);
                // Use of Object.defineProperty is important since it creates non-enumerable property which
                // prevents the property is copied during subclassing.
                const annotations = cls.hasOwnProperty(ANNOTATIONS)
                    ? (cls as any)[ANNOTATIONS]
                    : (Object.defineProperty(cls, ANNOTATIONS, {value: []}) as any)[ANNOTATIONS];
                annotations.push(annotationInstance);

                if (additionalProcessing) additionalProcessing(cls);

                return cls;
            };
        }

        if (parentClass) {
            DecoratorFactory.prototype = Object.create(parentClass.prototype);
        }

        DecoratorFactory.prototype.ngMetadataName = name;
        (DecoratorFactory as any).annotationCls = DecoratorFactory;
        return DecoratorFactory as any;
    });
}

export function makePropDecorator(
    name: string,
    props?: (...args: any[]) => any,
    parentClass?: any,
    additionalProcessing?: (target: any, name: string, ...args: any[]) => void,
): any {
    return noSideEffects(() => {
        const metaCtor = makeMetadataCtor(props);

        function PropDecoratorFactory(
            this: unknown | typeof PropDecoratorFactory,
            ...args: any[]
        ): any {
            if (this instanceof PropDecoratorFactory) {
                metaCtor.apply(this, args);
                return this;
            }

            const decoratorInstance = new (<any>PropDecoratorFactory)(...args);

            function PropDecorator(target: any, name: string) {
                // target is undefined with standard decorators. This case is not supported and will throw
                // if this decorator is used in JIT mode with standard decorators.
                if (target === undefined) {
                    throw new Error('Standard MiniNg field decorators are not supported in JIT mode.');
                }

                const constructor = target.constructor;
                // Use of Object.defineProperty is important because it creates a non-enumerable property
                // which prevents the property from being copied during subclassing.
                const meta = constructor.hasOwnProperty(PROP_METADATA)
                    ? (constructor as any)[PROP_METADATA]
                    : Object.defineProperty(constructor, PROP_METADATA, {value: {}})[PROP_METADATA];
                meta[name] = (meta.hasOwnProperty(name) && meta[name]) || [];
                meta[name].unshift(decoratorInstance);

                if (additionalProcessing) additionalProcessing(target, name, ...args);
            }

            return PropDecorator;
        }

        if (parentClass) {
            PropDecoratorFactory.prototype = Object.create(parentClass.prototype);
        }

        PropDecoratorFactory.prototype.ngMetadataName = name;
        (<any>PropDecoratorFactory).annotationCls = PropDecoratorFactory;
        return PropDecoratorFactory;
    });
}

export interface DirectiveDecorator {
    (obj?: Directive): TypeDecorator;
    new (obj?: Directive): Directive;
}

export interface Directive {}

function compileDirective(type: Type<any>, meta: Directive) {
    console.log(type, meta)
}

export const Directive: DirectiveDecorator = makeDecorator(
    'Directive',
    (dir: Directive = {}) => dir,
    undefined,
    undefined,
    (type: Type<any>, meta: Directive) => compileDirective(type, meta),
);

export interface Component extends Directive {}

export interface InputDecorator {
    (arg?: string | Input): any;
    new (arg?: string | Input): any;
}

export interface Input {
    alias?: string;
    required?: boolean;
    transform?: (value: any) => any;
}

export interface OutputDecorator {}
export interface Output {}

export const Output: OutputDecorator = makePropDecorator('Output', (alias?: string) => ({alias}));

export const Input: InputDecorator = makePropDecorator(
    'Input',
    (arg?: string | {alias?: string; required?: boolean}) => {
        if (!arg) {
            return {};
        }
        return typeof arg === 'string' ? {alias: arg} : arg;
    },
);


export interface Pipe extends Directive {}

export interface ComponentDecorator {

    (obj: Component): TypeDecorator;
    new (obj: Component): Component;

}

function compileComponent(type: Type<any>, meta: Component) {
    console.log(type, meta)
}

let ChangeDetectionStrategy;

export const Component: ComponentDecorator = makeDecorator(
    'Component',
    (c: Component = {}) => ({changeDetection: ChangeDetectionStrategy.Default, ...c}),
    Directive,
    undefined,
    (type: Type<any>, meta: Component) => compileComponent(type, meta),
);

export interface PipeDecorator {
    (obj: Pipe): TypeDecorator;
    new (obj: Pipe): Pipe;
}

function compilePipe(type: Type<any>, meta: Pipe) {}

export const Pipe: PipeDecorator = makeDecorator(
    'Pipe',
    (p: Pipe) => ({pure: true, ...p}),
    undefined,
    undefined,
    (type: Type<any>, meta: Pipe) => compilePipe(type, meta),
);

export const ViewChild = makeDecorator(
    'ViewChild',
    (p: Pipe) => ({pure: true, ...p}),
    undefined,
    undefined,
    (type: Type<any>, meta: Pipe) => compilePipe(type, meta),
);

export const ViewChildren = makeDecorator(
    'ViewChildren',
    (p: Pipe) => ({pure: true, ...p}),
    undefined,
    undefined,
    (type: Type<any>, meta: Pipe) => compilePipe(type, meta),
);

export const ContentChild = makeDecorator(
    'ContentChild',
    (p: Pipe) => ({pure: true, ...p}),
    undefined,
    undefined,
    (type: Type<any>, meta: Pipe) => compilePipe(type, meta),
);

export const ContentChildren = makeDecorator(
    'ContentChildren',
    (p: Pipe) => ({pure: true, ...p}),
    undefined,
    undefined,
    (type: Type<any>, meta: Pipe) => compilePipe(type, meta),
);
