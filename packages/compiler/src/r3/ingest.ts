import {BoundText, ChildNode, Element, Template, Text} from "../html_parser/nodes";
import {ForLoopBlock, IfBlock, SwitchNode} from "../html_parser/syntax-ast";
import {CompilationJob, ComponentCompilationJob, ViewCompilationUnit} from "../ir/compilation";
import * as ir from "../ir/ir"
import {
    ArrayLiteral,
    ArrowFunction,
    Binary, BindingPipe,
    Call,
    Comma,
    Conditional,
    False,
    Grouping,
    Identifier,
    Literal,
    New,
    ObjectLiteral,
    PostfixUpdate,
    PrefixUnary,
    PrefixUpdate,
    PropertyRead,
    SafeCall,
    SafePropertyRead,
    SpreadElement,
    True,
    YieldExpression
} from "../html_parser/ast/ast-impl";
import * as e from "../html_parser/ast/ast-impl"
import * as o from "../ir/output_ast"
import {
    ArrayLiteralExpr,
    BinaryExpr,
    BindingPipeExpr,
    CallExpr,
    CommaExpr, FalseExpr,
    IdentifierExpr,
    ObjectLiteralExpr,
    SpreadElementExpr, TrueExpr
} from "../ir/expression";
import {LiteralExpr} from "../ir/output_ast";

export function ingestComponent(componentName: string, nodes: ChildNode[]) {
    const job = new ComponentCompilationJob(componentName, [])
    ingestNodes(job.root, nodes);
    return job
}

function ingestNodes(unit: ViewCompilationUnit, nodes: ChildNode[]) {

    for (const node of nodes) {

        if (node instanceof Element) {
            ingestElement(unit, node);
        }

        if (node instanceof Text) {
            ingestText(unit, node);
        }

        if (node instanceof BoundText) {
            ingestBoundText(unit, node);
        }

        if (node instanceof Template) {

        }

        if (node instanceof IfBlock) {

        }

        if (node instanceof ForLoopBlock) {

        }

        if (node instanceof SwitchNode) {

        }
    }
}

const BINDING_KINDS = new Map<e.BindingType, ir.BindingKind>([
    [e.BindingType.Property, ir.BindingKind.Property],
    // [e.BindingType.TwoWay, ir.BindingKind.TwoWayProperty],
    [e.BindingType.Attribute, ir.BindingKind.Attribute],
    [e.BindingType.Class, ir.BindingKind.Class],
    [e.BindingType.Style, ir.BindingKind.Style],
    // [e.BindingType.LegacyAnimation, ir.BindingKind.LegacyAnimation],
    // [e.BindingType.Animation, ir.BindingKind.Animation],
]);

function ingestBindings(unit: ViewCompilationUnit, element: Element, op) {

    const bindings = [];

    for (const attr of element.attributes) {
        bindings.push(ir.createBindingOp(
                op.xref,
                ir.BindingKind.Attribute,
                attr.name,
                convertAstWithInterpolation(unit.job, attr.value),
                null,
                true,
                false,
                null
            )
        )
    }

    for (const input of element.inputs) {
        bindings.push(
            ir.createBindingOp(
                op.xref,
                BINDING_KINDS.get(input.type)!,
                input.name,
                convertAstWithInterpolation(unit.job, (input.value.ast)),
                null,
                false,
                false,
                null
            )
        )
    }

    unit.create.push(
        bindings.filter((b): b is ir.ExtractedAttributeOp => b?.kind === ir.OpKind.ExtractedAttribute),
    );
    unit.update.push(bindings.filter((b): b is ir.BindingOp => b?.kind === ir.OpKind.Binding));

    for (const output of element.outputs) {

        const handlerOps = new Array<ir.UpdateOp>();
        let handlerExprs = [output.handler];
        const expressions = handlerExprs.map((expr) => convertAst(expr.ast, unit.job));
        const returnExpr = expressions.pop()!;
        handlerOps.push(
            ...expressions.map((e) =>
                ir.createStatementOp<ir.UpdateOp>(new o.ExpressionStatement(e)),
            ),
        );
        handlerOps.push(ir.createStatementOp(new o.ReturnStatement(returnExpr)));

        const listenerOp = ir.createListenerOp(
            op.xref,
            op.handle,
            output.name,
            element.tagName,
            handlerOps,
            null,
            output.target,
            false
        )

        unit.create.push(listenerOp)
    }

}

function ingestReferences(op: ir.ElementOpBase, element: Element | Template): void {
    for (const {name, value} of element.references) {
        (op.localRefs as unknown as ir.LocalRef[]).push({
            name,
            target: value,
        });
    }
}

function ingestElement(unit: ViewCompilationUnit, node: Element) {
    const tag = node.tagName;
    const id = unit.job.allocateXrefId()
    // create elementStart
    const startOp = ir.createElementStartOp(tag, id);
    unit.create.push(startOp);
    
    ingestBindings(unit, node, startOp)

    ingestReferences(startOp, node)

    ingestNodes(unit, node.children);

    const endOp = ir.createElementEndOp(id);
    unit.create.push(endOp)
}

function ingestText(unit: ViewCompilationUnit, node: Text ){
    const id = unit.job.allocateXrefId();
    unit.create.push(ir.createTextOp(id, node.data))
}


function ingestBoundText(unit: ViewCompilationUnit, node: BoundText) {

    const textXref = unit.job.allocateXrefId();

    unit.create.push(ir.createTextOp(textXref, ''))

    unit.update.push(
        ir.createInterpolateTextOp(
            textXref,
            new ir.Interpolation(
                [], // value.strings,
                [ convertAst(node.value.ast, unit.job) ]
                // node.expressions.map((expr) => convertAst(expr, unit.job)),
            ),
        ),
    );

}

function convertAstWithInterpolation(
    job: CompilationJob,
    value: e.AstExpression | string,
): o.Expression | ir.Interpolation {
    let expression: o.Expression | ir.Interpolation;

    // if (value instanceof e.Interpolation) {
    //     expression = new ir.Interpolation(
    //         value.strings,
    //         value.expressions.map((e) => convertAst(e, job)),
    //     );
    // } else if (value instanceof e.AST) {
    //     expression = convertAst(value, job);
    // } else {
    //     expression = o.literal(value);
    // }

    if (value instanceof e.AstExpression) {
        expression = convertAst(value, job);
    } else {
        expression = o.literal(value);
    }

    return expression;
}

function convertAst(
    ast: e.AstExpression,
    job: CompilationJob,
): o.Expression {

    if (ast instanceof Comma) {
        return new CommaExpr(convertAst(ast.left, job), convertAst(ast.right, job));
    }

    if (ast instanceof SpreadElement) {
        return new SpreadElementExpr(convertAst(ast.expression, job), undefined)
    }

    if (ast instanceof Binary) {
        return new BinaryExpr(
            convertAst(ast.left, job),
            convertAst(ast.right, job),
            ast.operator,
            undefined
        )
    }

    if (ast instanceof Literal) {
        return new LiteralExpr(
            ast.value,
            ast.valueType,
            undefined
        )
    }

    if (ast instanceof Identifier) {
        return new IdentifierExpr(
            ast.name,
            undefined
        )
    }

    if (ast instanceof Call) {
        return new CallExpr(
            convertAst(ast.callee, job),
            ast.args.map(arg => convertAst(arg, job)),
            undefined
        )
    }

    if (ast instanceof True) {
        return new TrueExpr()
    }

    if (ast instanceof False) {
        return new FalseExpr()
    }

    if (ast instanceof ArrayLiteral) {
        return new ArrayLiteralExpr(ast.elements.map(el => convertAst(el, job)), undefined)
    }

    if (ast instanceof ObjectLiteral) {

        const entries = ast.properties.map(prop => {
            return {
                value: convertAst(prop.value, job),
                key: convertAst(prop.key, job)
            }
        })

        return new ObjectLiteralExpr(entries, undefined)
    }

    if (ast instanceof BindingPipe) {
        return new BindingPipeExpr(
            job.allocateXrefId(), new ir.SlotHandle(),
            ast.name,
            [ast.expression, ...ast.args].map(arg => convertAst(arg, job)),
            undefined
        )
    }

    throw new Error(
        `Unhandled expression type "${ast.constructor.name}" in file "`,
    );

}

// Comma
// SpreadElement
// YieldExpression
// ArrowFunction
// Identifier
// Conditional
// Binary
// PrefixUnary
// PrefixUpdate
// PostfixUpdate
// PropertyRead
// SafePropertyRead
// Call
// SafeCall
// New
// Literal
// True
// False
// Grouping
// ArrayLiteral
// ObjectLiteral
