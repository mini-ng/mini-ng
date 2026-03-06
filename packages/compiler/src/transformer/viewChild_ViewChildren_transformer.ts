import * as ts from "typescript";

function isDecorator(dec: ts.Decorator, decoratorName: string): boolean {
    const expr = dec.expression;

    if (ts.isIdentifier(expr)) {
        return expr.text === decoratorName;
    }

    if (ts.isCallExpression(expr)) {
        return ts.isIdentifier(expr.expression)
            && expr.expression.text === decoratorName;
    }

    return false;
}

export function extractViewChildViewChildren(node: ts.ClassDeclaration) {
    for (const member of node.members) {
        if (!ts.isPropertyDeclaration(member)) continue;
        if (!member.name || !ts.isIdentifier(member.name)) continue;

        const decorators = ts.canHaveDecorators(member)
            ? ts.getDecorators(member)
            : undefined;

        if (!decorators) continue;

        for (const dec of decorators) {

            if (isDecorator(dec, "ViewChild")) {
            }

            if (isDecorator(dec, "ViewChildren")) {
            }

        }
    }
}
