import {ExpressionParser} from "../expr_parser/expr_parser";
import ts, {factory} from "typescript";
import {Element, Node, Text} from "domhandler";
import {getRootObject} from "../utils/utils";

export function forTrackByParser(node: Element, slotIndex: number, trackBy: string) {

    const source = trackBy
    const sourceFile = ts.createSourceFile("__mini_ng_expression_parser.ts", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
    const trackByFunctionName = "_" + slotIndex + "_TrackBy_Function";

    // ɵɵrepeaterTrackByIdentity

    let expression: ts.Expression

    sourceFile.statements.forEach((statement) => {
        if (ts.isExpressionStatement(statement)) {
            const expr = statement.expression;

            // if (ts.isIdentifier(expr)) {
            //     return {
            //         trackByFunctionName: "i0.ɵɵrepeaterTrackByIdentity",
            //         functionNode: undefined
            //     }
            // }

            if (ts.isPropertyAccessExpression(expr)) {
                expression = expr
            }

        }
    })

    if (!expression) {
        return {}
    }

    const object = getRootObject(expression)

    const functionNode = factory.createVariableStatement(
        undefined,
        factory.createVariableDeclarationList(
            [factory.createVariableDeclaration(
                factory.createIdentifier(trackByFunctionName),
                undefined,
                undefined,
                factory.createArrowFunction(
                    undefined,
                    undefined,
                    [
                        factory.createParameterDeclaration(
                            undefined,
                            undefined,
                            factory.createIdentifier("$index"),
                            undefined,
                            undefined,
                            undefined
                        ),
                        factory.createParameterDeclaration(
                            undefined,
                            undefined,
                            (object.getText()),
                            undefined,
                            undefined,
                            undefined
                        )
                    ],
                    undefined,
                    factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
                    expression
                )
            )],
            ts.NodeFlags.Const | ts.NodeFlags.Constant | ts.NodeFlags.Constant
        )
    )

    return { trackByFunctionName, functionNode }

}
