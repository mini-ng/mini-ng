import * as ir from "./ir"
import * as o from "./output_ast"

export enum CompilationJobKind {
    Both,
    Tmpl,
    Host,
}

export class ConstantPool {
    statements: o.Statement[];
}

export abstract class CompilationJob {
    constructor(
        readonly componentName: string,
        readonly pool: ConstantPool,
        // readonly compatibility: ir.CompatibilityMode,
        // readonly mode: TemplateCompilationMode,
    ) {}

    kind: CompilationJobKind = CompilationJobKind.Both;

    abstract get units(): Iterable<CompilationUnit>;

    abstract root: CompilationUnit;

    abstract fnSuffix: string;

    allocateXrefId(): ir.XrefId {
        return this.nextXrefId++ as ir.XrefId;
    }

    private nextXrefId: ir.XrefId = 0 as ir.XrefId;
}

export class ComponentCompilationJob extends CompilationJob {
    constructor(
        componentName: string,
        pool: ConstantPool,
        // compatibility: ir.CompatibilityMode,
        // mode: TemplateCompilationMode,
        // readonly relativeContextFilePath: string,
        // readonly i18nUseExternalIds: boolean,
        // readonly deferMeta: R3ComponentDeferMetadata,
        // readonly allDeferrableDepsFn: o.ReadVarExpr | null,
        // readonly relativeTemplatePath: string | null,
        // readonly enableDebugLocations: boolean,
    ) {
        super(componentName, pool); //, compatibility, mode);
        this.root = new ViewCompilationUnit(this, this.allocateXrefId(), null);
        this.views.set(this.root.xref, this.root);
    }

    override kind = CompilationJobKind.Tmpl;

    override readonly fnSuffix: string = 'Template';

    override readonly root: ViewCompilationUnit;

    readonly views = new Map<ir.XrefId, ViewCompilationUnit>();

    public contentSelectors: o.Expression | null = null;

    allocateView(parent: ir.XrefId): ViewCompilationUnit {
        const view = new ViewCompilationUnit(this, this.allocateXrefId(), parent);
        this.views.set(view.xref, view);
        return view;
    }

    override get units(): Iterable<ViewCompilationUnit> {
        return this.views.values();
    }

    addConst(newConst: o.Expression, initializers?: o.Statement[]): ir.ConstIndex {
        for (let idx = 0; idx < this.consts.length; idx++) {
            if (this.consts[idx].isEquivalent(newConst)) {
                return idx as ir.ConstIndex;
            }
        }
        const idx = this.consts.length;
        this.consts.push(newConst);
        if (initializers) {
            this.constsInitializers.push(...initializers);
        }
        return idx as ir.ConstIndex;
    }

    readonly consts: o.Expression[] = [];

    readonly constsInitializers: o.Statement[] = [];
}

export abstract class CompilationUnit {
    constructor(readonly xref: ir.XrefId) {}

    readonly create = new ir.OpList<ir.CreateOp>();

    readonly update = new ir.OpList<ir.UpdateOp>();

    readonly functions = new Set<ir.ArrowFunctionExpr>();

    abstract readonly job: CompilationJob;

    fnName: string | null = null;

    vars: number | null = null;

    *ops(): Generator<ir.CreateOp | ir.UpdateOp> {
        for (const expr of this.functions) {
            // for (const op of expr.ops) {
            //     yield op;
            // }
        }
        for (const op of this.create) {
            yield op;
            if (
                op.kind === ir.OpKind.Listener //||
                // op.kind === ir.OpKind.Animation ||
                // op.kind === ir.OpKind.AnimationListener ||
                // op.kind === ir.OpKind.TwoWayListener
            ) {
                for (const listenerOp of op.handlerOps) {
                    yield listenerOp;
                }
            }
            // else if (op.kind === ir.OpKind.RepeaterCreate && op.trackByOps !== null) {
            //     for (const trackOp of op.trackByOps) {
            //         yield trackOp;
            //     }
            // }
        }
        for (const op of this.update) {
            yield op;
        }
    }
}

export class ViewCompilationUnit extends CompilationUnit {
    constructor(
        readonly job: ComponentCompilationJob,
        xref: ir.XrefId,
        readonly parent: ir.XrefId | null,
    ) {
        super(xref);
    }

}
