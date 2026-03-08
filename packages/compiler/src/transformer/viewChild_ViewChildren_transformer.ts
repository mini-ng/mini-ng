import * as ts from "typescript";
import {factory, Identifier} from "typescript";
import {RenderFlags} from "../render/flags";
import {i0, ɵɵviewQuery} from "../constants/constants";

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

export enum QueryFlags {
    Descendants,
    Static,
    Read
}

// ViewChild(selector: ProviderToken<unknown> | Function | string, opts?: {read?: any, static?: boolean}): any
// Property decorator that configures a view query. The change detector looks for the first element or the directive matching the selector in the view DOM. If the view DOM changes, and a new child matches the selector, the property is updated.
//     Metadata Properties:
//     selector - The directive type or the name used for querying.
//     read - Used to read a different token from the queried elements.
//     static - true to resolve query results before change detection runs, false to resolve after change detection. Defaults to false.
//     The following selectors are supported.
//     Any class with the @Component or @Directive decorator

export function extractViewChildViewChildren(node: ts.ClassDeclaration) {

    const viewChilds: (ts.Statement)[] = []

    for (const member of node.members) {
        if (!ts.isPropertyDeclaration(member)) continue;
        if (!member.name || !ts.isIdentifier(member.name)) continue;

        const decorators = ts.canHaveDecorators(member)
            ? ts.getDecorators(member)
            : undefined;

        if (!decorators) continue;

        for (const dec of decorators) {

            if (isDecorator(dec, "ViewChild") || isDecorator(dec, "ViewChildren")) {
                if ((dec.expression as ts.CallExpression).arguments?.length) {
                    const _arguments = (dec.expression as ts.CallExpression).arguments;
                    const selector = _arguments[0];
                    const opts = _arguments[1];

                    const args = [selector]

                    if (opts && ts.isObjectLiteralExpression(opts)) {
                        opts.properties.forEach((property) => {
                            if (ts.isPropertyAssignment(property)) {
                                const { name, initializer } = property

                                if ((name as Identifier).escapedText === "read") {
                                    args.push(initializer)
                                } else if ((name as Identifier).escapedText === "static") {
                                    args.push(initializer)
                                }
                            }
                        })
                    }

                    viewChilds.push(
                        ts.factory.createExpressionStatement(
                        ts.factory.createCallExpression(
                            ts.factory.createPropertyAccessExpression(
                                ts.factory.createIdentifier(i0),
                                ts.factory.createIdentifier(ɵɵviewQuery)
                            ),
                            undefined,
                            args
                        )
                    )
                    );

                }
            }

        }

    }

    const createNode = ts.factory.createIfStatement(
        factory.createBinaryExpression(
            ts.factory.createIdentifier("rf"),
            ts.SyntaxKind.AmpersandToken,
            ts.factory.createIdentifier(RenderFlags.CREATE.toString())
        ),
        ts.factory.createBlock([...viewChilds], true),
        undefined
    );

    const updateNode = ts.factory.createIfStatement(
        factory.createBinaryExpression(
            ts.factory.createIdentifier("rf"),
            ts.SyntaxKind.AmpersandToken,
            ts.factory.createIdentifier(RenderFlags.UPDATE.toString())
        ),
        ts.factory.createBlock([], true),
        undefined
    );

    return ts.factory.createFunctionExpression(
        undefined, undefined,
        node.name.escapedText + "_Query", undefined,
        [
            ts.factory.createParameterDeclaration(
                undefined, undefined, "ctx"
            ),ts.factory.createParameterDeclaration(
            undefined, undefined, "rf"
        )
        ], undefined,
        ts.factory.createBlock(
            [createNode, updateNode]
        )
    )
}
