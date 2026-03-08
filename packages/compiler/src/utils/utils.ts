import ts from "typescript";

export function stripQuotes(value: string): string {
    if (
        (value.startsWith("'") && value.endsWith("'")) ||
        (value.startsWith('"') && value.endsWith('"'))
    ) {
        return value.slice(1, -1);
    }
    return value;
}

export function getRootObject(expr: ts.Expression): ts.Expression {

    while (
        ts.isPropertyAccessExpression(expr) ||
        ts.isElementAccessExpression(expr)
        ) {
        expr = expr.expression;
    }

    return expr;
}
