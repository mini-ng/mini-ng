import {CompilationJob, ComponentCompilationJob} from "../../ir/compilation";
import * as ir from "../../ir";
import * as o from "../../ir/output_ast"
import * as core from "../../ir/core"

export function constCollection(job: CompilationJob) {
    const allElementAttributes = new Map<ir.XrefId, ElementAttributes>();
    for (const unit of job.units) {
        for (const op of unit.create) {
            if (op.kind === ir.OpKind.ExtractedAttribute) {
                const attributes =
                    allElementAttributes.get(op.target) || new ElementAttributes(job.compatibility);
                allElementAttributes.set(op.target, attributes);
                attributes.add(op.bindingKind, op.name, op.expression, op.namespace, op.trustedValueFn);
                ir.OpList.remove<ir.CreateOp>(op);
            }
        }
    }

    // Serialize the extracted attributes into the const array.
    if (job instanceof ComponentCompilationJob) {
        for (const unit of job.units) {
            for (const op of unit.create) {

                // if (op.kind == ir.OpKind.Projection) {
                //     const attributes = allElementAttributes.get(op.xref);
                //     if (attributes !== undefined) {
                //         const attrArray = serializeAttributes(attributes);
                //         if (attrArray.entries.length > 0) {
                //             op.attributes = attrArray;
                //         }
                //     }
                // }
                // else
                    if (ir.isElementOrContainerOp(op)) {
                    op.attributes = getConstIndex(job, allElementAttributes, op.xref);

                    // if (op.kind === ir.OpKind.RepeaterCreate && op.emptyView !== null) {
                    //     op.emptyAttributes = getConstIndex(job, allElementAttributes, op.emptyView);
                    // }
                }
            }
        }
    }
}

function getConstIndex(
    job: ComponentCompilationJob,
    allElementAttributes: Map<ir.XrefId, ElementAttributes>,
    xref: ir.XrefId,
): ir.ConstIndex | null {
    const attributes = allElementAttributes.get(xref);
    if (attributes !== undefined) {
        const attrArray = serializeAttributes(attributes);
        if (attrArray.elements.length > 0) {
            return job.addConst(attrArray);
        }
    }
    return null;
}

const FLYWEIGHT_ARRAY: ReadonlyArray<o.Expression> = Object.freeze<o.Expression[]>([]);

class ElementAttributes {
    private known = new Map<ir.BindingKind, Set<string>>();
    private byKind = new Map<
        // Property bindings are excluded here, because they need to be tracked in the same
        // array to maintain their order. They're tracked in the `propertyBindings` array.
        Exclude<ir.BindingKind, ir.BindingKind.Property /*| ir.BindingKind.TwoWayProperty*/>,
        o.Expression[]
    >();
    private propertyBindings: o.Expression[] | null = null;

    projectAs: string | null = null;

    get attributes(): ReadonlyArray<o.Expression> {
        return this.byKind.get(ir.BindingKind.Attribute) ?? FLYWEIGHT_ARRAY;
    }

    get classes(): ReadonlyArray<o.Expression> {
        return this.byKind.get(ir.BindingKind.Class) ?? FLYWEIGHT_ARRAY;
    }

    get styles(): ReadonlyArray<o.Expression> {
        return this.byKind.get(ir.BindingKind.Style) ?? FLYWEIGHT_ARRAY;
    }

    get bindings(): ReadonlyArray<o.Expression> {
        return this.propertyBindings ?? FLYWEIGHT_ARRAY;
    }

    get template(): ReadonlyArray<o.Expression> {
        return this.byKind.get(ir.BindingKind.Template) ?? FLYWEIGHT_ARRAY;
    }

    // get i18n(): ReadonlyArray<o.Expression> {
    //     return this.byKind.get(ir.BindingKind.I18n) ?? FLYWEIGHT_ARRAY;
    // }

    constructor(private compatibility: ir.CompatibilityMode) {}

    private isKnown(kind: ir.BindingKind, name: string) {
        const nameToValue = this.known.get(kind) ?? new Set<string>();
        this.known.set(kind, nameToValue);
        if (nameToValue.has(name)) {
            return true;
        }
        nameToValue.add(name);
        return false;
    }

    add(
        kind: ir.BindingKind,
        name: string,
        value: o.Expression | null,
        namespace: string | null,
        trustedValueFn: o.Expression | null,
    ): void {

        const allowDuplicates =
            this.compatibility === ir.CompatibilityMode.TemplateDefinitionBuilder &&
            (kind === ir.BindingKind.Attribute /*||
                kind === ir.BindingKind.ClassName ||
                kind === ir.BindingKind.StyleProperty*/);
        if (!allowDuplicates && this.isKnown(kind, name)) {
            return;
        }

        if (name === 'ngProjectAs') {
            if (
                value === null ||
                !(value instanceof o.LiteralExpr) ||
                value.value == null ||
                typeof value.value?.toString() !== 'string'
            ) {
                throw Error('ngProjectAs must have a string literal value');
            }
            this.projectAs = value.value.toString();
        }

        const array = this.arrayFor(kind);
        array.push(...getAttributeNameLiterals(namespace, name));
        if (kind === ir.BindingKind.Attribute /*|| kind === ir.BindingKind.StyleProperty*/) {
            if (value === null) {
                throw Error('Attribute, i18n attribute, & style element attributes must have a value');
            }
            if (trustedValueFn !== null) {
                if (!ir.isStringLiteral(value)) {
                    throw Error('AssertionError: extracted attribute value should be string literal');
                }
                // array.push(
                //     o.taggedTemplate(
                //         trustedValueFn,
                //         new o.TemplateLiteralExpr([new o.TemplateLiteralElementExpr(value.value)], []),
                //         undefined,
                //         value.sourceSpan,
                //     ),
                // );
            } else {
                array.push(value);
            }
        }
    }

    private arrayFor(kind: ir.BindingKind): o.Expression[] {
        if (kind === ir.BindingKind.Property /*|| kind === ir.BindingKind.TwoWayProperty*/) {
            this.propertyBindings ??= [];
            return this.propertyBindings;
        } else {
            if (!this.byKind.has(kind)) {
                this.byKind.set(kind, []);
            }
            return this.byKind.get(kind)!;
        }
    }
}

function getAttributeNameLiterals(namespace: string | null, name: string): o.LiteralExpr[] {
    const nameLiteral = o.literal(name);

    if (namespace) {
        return [o.literal(core.AttributeMarker.NamespaceURI), o.literal(namespace), nameLiteral];
    }

    return [nameLiteral];
}

function serializeAttributes({
                                 attributes,
                                 bindings,
                                 classes,
                                 // i18n,
                                 projectAs,
                                 styles,
                                 template,
                             }: ElementAttributes): o.ArrayLiteralExpr {
    const attrArray = [...attributes];

    // if (projectAs !== null) {
    //     // Parse the attribute value into a CssSelectorList. Note that we only take the
    //     // first selector, because we don't support multiple selectors in ngProjectAs.
    //     const parsedR3Selector = core.parseSelectorToR3Selector(projectAs)[0];
    //     attrArray.push(
    //         o.literal(core.AttributeMarker.ProjectAs),
    //         literalOrArrayLiteral(parsedR3Selector),
    //     );
    // }
    if (classes.length > 0) {
        attrArray.push(o.literal(core.AttributeMarker.Classes), ...classes);
    }
    if (styles.length > 0) {
        attrArray.push(o.literal(core.AttributeMarker.Styles), ...styles);
    }
    if (bindings.length > 0) {
        attrArray.push(o.literal(core.AttributeMarker.Bindings), ...bindings);
    }
    if (template.length > 0) {
        attrArray.push(o.literal(core.AttributeMarker.Template), ...template);
    }
    // if (i18n.length > 0) {
    //     attrArray.push(o.literal(core.AttributeMarker.I18n), ...i18n);
    // }
    return o.literalArr(attrArray);
}
