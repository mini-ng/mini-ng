import ts, {factory} from "typescript";
import {Element} from "../html_parser/nodes";
import {getRootObject} from "../utils/utils";

export function forTrackByParser(node: Element, slotIndex: number, trackBy: string) {
    const source = trackBy.trim();

    const sourceFile = ts.createSourceFile(
        "__mini_ng_expression_parser.ts",
        source,
        ts.ScriptTarget.Latest,
        true,
        ts.ScriptKind.TS
    );

    const trackByFunctionName = "_" + slotIndex + "_TrackBy_Function";

    let expression: ts.Expression | undefined;

    sourceFile.statements.forEach((statement) => {
        if (ts.isExpressionStatement(statement)) {
            const expr = statement.expression;

            if (ts.isPropertyAccessExpression(expr)) {
                expression = expr;
            }
        }
    });

    if (!expression) return {};

    const object = getRootObject(expression);

    const functionNode = factory.createVariableStatement(
        undefined,
        factory.createVariableDeclarationList(
            [
                factory.createVariableDeclaration(
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
                                factory.createIdentifier("$index")
                            ),
                            factory.createParameterDeclaration(
                                undefined,
                                undefined,
                                factory.createIdentifier(object.getText())
                            ),
                        ],
                        undefined,
                        factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
                        expression
                    )
                ),
            ],
            ts.NodeFlags.Const
        )
    );

    return { trackByFunctionName, functionNode };
}
