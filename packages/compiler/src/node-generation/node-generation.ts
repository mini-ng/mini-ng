import {
    $event, ctx,
    i0, ɵɵadvance, ɵɵconditional,
    ɵɵelementEnd,
    ɵɵelementStart,
    ɵɵlistener,
    ɵɵpipe, ɵɵproperty, ɵɵrepeater, ɵɵrepeaterCreate, ɵɵtemplate,
    ɵɵtext, ɵɵtextInterpolate,
    ɵɵtextStyle
} from "../constants/constants";
import {ExpressionParser} from "../expr_parser/expr_parser";
import ts, {factory, SourceFile} from "typescript";
import {Element} from "../html_parser/nodes";

export type InterpolationType = {
    type: 'text' | 'expression' | 'statement',
    statement?: ts.ExpressionStatement;
    content?: string
}

export function generateElementStartNode(
    index: number,
    element: string,
    attrsIndex?: number,
    localRefIndex?: number,
) {
    const params = [
        ts.factory.createNumericLiteral(index),
        ts.factory.createStringLiteral(element),
    ];

    if (attrsIndex !== null && attrsIndex !== undefined && attrsIndex >= 0) {
        params.push(ts.factory.createNumericLiteral(attrsIndex));
    }

    if (localRefIndex) {
        params.push(ts.factory.createNumericLiteral(localRefIndex));
    }

    return ts.factory.createExpressionStatement(
        ts.factory.createCallExpression(
            ts.factory.createPropertyAccessExpression(
                ts.factory.createIdentifier(i0),
                ts.factory.createIdentifier(ɵɵelementStart)
            ),
            undefined,
            params
        )
    );
}

export function generateElementEndNode() {
    return ts.factory.createExpressionStatement(
        ts.factory.createCallExpression(
            ts.factory.createPropertyAccessExpression(
                ts.factory.createIdentifier(i0),
                ts.factory.createIdentifier(ɵɵelementEnd)
            ),
            undefined,
            []
        )
    );
}

export function generateTextNode(index: number, text?: string) {
    const params: ts.Expression[] = [
        ts.factory.createNumericLiteral(index),
    ];

    if (text) {
        params.push(ts.factory.createStringLiteral(text));
    }

    return ts.factory.createExpressionStatement(
        ts.factory.createCallExpression(
            ts.factory.createPropertyAccessExpression(
                ts.factory.createIdentifier(i0),
                ts.factory.createIdentifier(ɵɵtext)
            ),
            undefined,
            params
        )
    );
}

export function generatePipeNode(index: number, text: string) {
    const params: ts.Expression[] = [
        ts.factory.createNumericLiteral(index),
        ts.factory.createStringLiteral(text),
    ];

    return ts.factory.createExpressionStatement(
        ts.factory.createCallExpression(
            ts.factory.createPropertyAccessExpression(
                ts.factory.createIdentifier(i0),
                ts.factory.createIdentifier(ɵɵpipe)
            ),
            undefined,
            params
        )
    );
}

export function generateTextStyleNode(index: number, text?: string) {

    const params: ts.Expression[] = [
        ts.factory.createNumericLiteral(index),
    ];

    if (text) {
        params.push(ts.factory.createStringLiteral(text));
    }

    return ts.factory.createExpressionStatement(
        ts.factory.createCallExpression(
            ts.factory.createPropertyAccessExpression(
                ts.factory.createIdentifier(i0),
                ts.factory.createIdentifier(ɵɵtextStyle)
            ),
            undefined,
            params
        )
    );
}

export function generateListenerNode(eventName: string, tag: string, index: number, handler: string) {
    return ts.factory.createExpressionStatement(
        ts.factory.createCallExpression(
            ts.factory.createPropertyAccessExpression(
                ts.factory.createIdentifier(i0),
                ts.factory.createIdentifier(ɵɵlistener)
            ),
            undefined,
            [
                ts.factory.createStringLiteral(eventName),
                ts.factory.createArrowFunction(
                    undefined,
                    undefined,
                    [ts.factory.createParameterDeclaration(
                        undefined, undefined, ts.factory.createIdentifier($event), undefined, undefined, undefined
                    )],
                    undefined,
                    ts.factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
                    ts.factory.createBlock(
                        [
                            ts.factory.createReturnStatement(
                                ts.factory.createPropertyAccessExpression(
                                    ts.factory.createIdentifier(ctx),
                                    ts.factory.createIdentifier(handler)
                                )
                            )
                        ]
                    )
                )
            ]
        )
    )
}

export function generatePropertyNode(propertyName: string, value: string, implicitVariables: string[]) {

    const exprParser = new ExpressionParser();
    const transformedNode = exprParser.parse(value, implicitVariables);

    return ts.factory.createExpressionStatement(
        ts.factory.createCallExpression(
            ts.factory.createPropertyAccessExpression(
                ts.factory.createIdentifier(i0),
                ts.factory.createIdentifier(ɵɵproperty)
            ),
            undefined,
            [
                ts.factory.createStringLiteral(propertyName),
                // @ts-ignore
                transformedNode.statements[0].expression
                // ts.factory.createStringLiteral(value)
            ]
        )
    )
}

export function generatePropertyNodeV2(propertyName: string, value: ts.Expression, implicitVariables: string[]) {

    return ts.factory.createExpressionStatement(
        ts.factory.createCallExpression(
            ts.factory.createPropertyAccessExpression(
                ts.factory.createIdentifier(i0),
                ts.factory.createIdentifier(ɵɵproperty)
            ),
            undefined,
            [
                ts.factory.createStringLiteral(propertyName),
                value
            ]
        )
    )
}

export function generateAdvanceNode(index: string | number) {

    if (typeof index === 'number') {
        index = index.toString()
    }

    return factory.createExpressionStatement(factory.createCallExpression(
        factory.createPropertyAccessExpression(
            factory.createIdentifier(i0),
            ɵɵadvance
        ), undefined,
        [
            factory.createIdentifier(index)
        ]
    ))
}

export function generateTextInterpolateNode(bindingExpressions: InterpolationType[], implicitVariables: string[]) {

    const exprParser = new ExpressionParser();

    const bindingExpressionStmts = bindingExpressions.map((binding) => {
        if (binding.type === 'text') {
            return factory.createStringLiteral(binding.content)
        } else if (binding.type === 'expression') {
            const transformedNode = exprParser.parse(binding.content, implicitVariables);
            // @ts-ignore
            return transformedNode.statements[0].expression;
        } else if (binding.type === 'statement') {
            return binding.statement
        }
    }).filter(Boolean)

    // @ts-ignore
    const expressionStatement = factory.createExpressionStatement(factory.createCallExpression(
        factory.createPropertyAccessExpression(
            factory.createIdentifier(i0),
            ɵɵtextInterpolate
        ), undefined,
        // @ts-ignore
        [
            // @ts-ignore
            ...bindingExpressionStmts
        ]
    ))
    return expressionStatement
}

export function generateTextInterpolateNodeV2(expression: ts.Expression, implicitVariables: string[]) {

    const expressionStatement = factory.createExpressionStatement(factory.createCallExpression(
        factory.createPropertyAccessExpression(
            factory.createIdentifier(i0),
            ɵɵtextInterpolate
        ), undefined,
        [
            expression
        ]
    ));

    return expressionStatement
}

export function generateTemplateNode(
    index: number,
    functionName: string,
    templateName: string,
    attrsIndex?: number | null,
    localRefsIndex?: number | null
) {

    const nodeArguments = [
        ts.factory.createNumericLiteral(index),
        ts.factory.createIdentifier(functionName),
        ts.factory.createStringLiteral(templateName)
    ];

    if (attrsIndex) {
        nodeArguments.push(
            ts.factory.createNumericLiteral(index)
        )
    }

    if (localRefsIndex) {
        nodeArguments.push(ts.factory.createNumericLiteral(localRefsIndex))
    }

    return ts.factory.createExpressionStatement(
        ts.factory.createCallExpression(
            ts.factory.createPropertyAccessExpression(
                ts.factory.createIdentifier(i0),
                ts.factory.createIdentifier(ɵɵtemplate)
            ),
            undefined,
            nodeArguments
        )
    )
}

export function generateConditionalNode(conditionals: any[], containerIndex: number) {

    const exprParser = new ExpressionParser();

    let expr: ts.Expression

    if (conditionals.length == 1) {

        const condition = conditionals[0];

        const conditionExpr =
            // @ts-ignore
            exprParser.parse(condition.attributeValue).statements[0].expression;

        expr = ts.factory.createConditionalExpression(
            conditionExpr,
            ts.factory.createToken(ts.SyntaxKind.QuestionToken),
            // @ts-ignore
            exprParser.parse(condition.slotIndex.toString()).statements[0].expression,
            ts.factory.createToken(ts.SyntaxKind.ColonToken),
            ts.factory.createNumericLiteral("-1")
        );
    } else {

        for (let i = conditionals.length - 1; i >= 0; i--) {

            const { type, slotIndex, attributeValue } = conditionals[i];
            const conditionType = type

            if (conditionType === 'else') {
                // @ts-ignore
                expr = exprParser.parse(slotIndex.toString()).statements[0].expression;
                continue
            }

            if (conditionType === 'elseif') {

                const conditionExpr =
                    // @ts-ignore
                    exprParser.parse(attributeValue).statements[0].expression;

                expr = ts.factory.createConditionalExpression(
                    conditionExpr,
                    ts.factory.createToken(ts.SyntaxKind.QuestionToken),
                    // @ts-ignore
                    exprParser.parse(slotIndex.toString()).statements[0].expression,
                    ts.factory.createToken(ts.SyntaxKind.ColonToken),
                    expr
                );
                continue
            }

            if (conditionType === 'if') {

                const conditionExpr =
                    // @ts-ignore
                    exprParser.parse(attributeValue).statements[0].expression;

                expr = ts.factory.createConditionalExpression(
                    conditionExpr,
                    ts.factory.createToken(ts.SyntaxKind.QuestionToken),
                    // @ts-ignore
                    exprParser.parse(slotIndex.toString()).statements[0].expression, // must be ts.Expression
                    ts.factory.createToken(ts.SyntaxKind.ColonToken),
                    expr
                );

            }

        }

    }

    const containerEndIndex = containerIndex + conditionals.length - 1

    return ts.factory.createExpressionStatement(
        ts.factory.createCallExpression(
            ts.factory.createPropertyAccessExpression(
                ts.factory.createIdentifier(i0),
                ts.factory.createIdentifier(ɵɵconditional)
            ),
            undefined,
            [
                ts.factory.createNumericLiteral(containerIndex),
                ts.factory.createNumericLiteral(containerEndIndex),
                expr
            ]
        )
    );
}

export function generateConditionalNodeV2(containerIndex: number, containerEndIndex: number, expr: ts.Expression) {
    return ts.factory.createExpressionStatement(
        ts.factory.createCallExpression(
            ts.factory.createPropertyAccessExpression(
                ts.factory.createIdentifier(i0),
                ts.factory.createIdentifier(ɵɵconditional)
            ),
            undefined,
            [
                ts.factory.createNumericLiteral(containerIndex),
                ts.factory.createNumericLiteral(containerEndIndex),
                expr
            ]
        )
    );
}

export function generateRepeaterCreateNode(tagName: string, slotIndex: number, functionName: string, emptyTemplateFnName?: string, trackBy?: string, ɵɵrepeaterTrackByIdentity?, trackByFunctionName?: string) {
    const trackByFnNode = trackBy ? trackByFunctionName ? ts.factory.createIdentifier(trackByFunctionName) : factory.createPropertyAccessExpression(
        factory.createIdentifier("i0"),
        factory.createIdentifier("ɵɵrepeaterTrackByIdentity")
    ) : ts.factory.createNull();

    return ts.factory.createExpressionStatement(
        ts.factory.createCallExpression(
            ts.factory.createPropertyAccessExpression(
                ts.factory.createIdentifier(i0),
                ts.factory.createIdentifier(ɵɵrepeaterCreate)
            ), undefined,
            [
                ts.factory.createNumericLiteral(slotIndex),
                ts.factory.createIdentifier(functionName),
                ts.factory.createNumericLiteral(0),
                ts.factory.createNumericLiteral(0),
                ts.factory.createStringLiteral(tagName),
                ts.factory.createNull(),
                trackByFnNode, // trackByFn
                ts.factory.createNull(),
                emptyTemplateFnName ? ts.factory.createIdentifier(emptyTemplateFnName) : ts.factory.createNull(),
                ts.factory.createNull(),
                ts.factory.createNull(),
                emptyTemplateFnName ? ts.factory.createStringLiteral("ng-for-empty") : ts.factory.createNull(),
                ts.factory.createNull(),
            ]
        )
    )
}

export function generateUpdateRepeaterNode(exprParserSourceFile: SourceFile) {
    return ts.factory.createExpressionStatement(
        ts.factory.createCallExpression(
            ts.factory.createPropertyAccessExpression(
                ts.factory.createIdentifier(i0),
                ts.factory.createIdentifier(ɵɵrepeater)
            ),
            undefined,
            [
                // @ts-ignore
                exprParserSourceFile.statements[0].expression
            ]
        )
    )
}

export function generateUpdateRepeaterNodeV2(node: ts.Expression[]) {
    return ts.factory.createExpressionStatement(
        ts.factory.createCallExpression(
            ts.factory.createPropertyAccessExpression(
                ts.factory.createIdentifier(i0),
                ts.factory.createIdentifier(ɵɵrepeater)
            ),
            undefined,
            node
        )
    )
}

export function generateProjectionDef( projectionSlots: any[]) {

    const args = projectionSlots

    return factory.createExpressionStatement(factory.createCallExpression(
        factory.createPropertyAccessExpression(
            factory.createIdentifier(i0),
            factory.createIdentifier("ɵɵprojectionDef")
        ),
        undefined,
        args
    ))

}

export function generateProjection(
    nodeIndex: number = 0,
    selectorIndex?: number,
    // attrs?: TAttributes
) {

    const args = [
        factory.createNumericLiteral(nodeIndex)
    ]

    if (selectorIndex) {
        args.push(factory.createNumericLiteral(selectorIndex))
    }

    return factory.createExpressionStatement(factory.createCallExpression(
        factory.createPropertyAccessExpression(
            factory.createIdentifier(i0),
            factory.createIdentifier("ɵɵprojection")
        ),
        undefined,
        args
    ))

}

// | Keyword   | Becomes          |
// | --------- | ---------------- |
// | `of`      | prefix + Of      |
// | `trackBy` | prefix + TrackBy |
// | `when`    | prefix + When    |
// | `else`    | prefix + Else    |
// | Part           | Meaning           |
// | -------------- | ----------------- |
// | `tpl`          | main expression   |
// | `context: ctx` | secondary binding |
export function parseMicroSyntax(directiveName: string, directiveValue: string) {

    const attribs = {}

    if (directiveValue.startsWith("let ")) {
        // this is a Of

        const parts = directiveValue.split(";")
        const forOfPart = parts[0];

        const forOfParts = forOfPart.split(" ").map(part => part.trim())

        if (forOfParts.length < 4) {
            throw new Error("This attribute must be in the format: let user of users");
        }

        const letOf = forOfParts[0];
        const iterOf = forOfParts[1];
        const arrayOf = forOfParts[3];

        if (letOf !== "let") throw new Error("This attribute must be in the format: let user of users");

        attribs["let-" + iterOf] = "";
        attribs["[" + directiveName + "Of]"] = arrayOf;
        attribs["" + directiveName + ""] = ""

        return attribs

    }

    if (directiveValue.split(";").length > 1) {


        // prefix secondary bindings with directive name.

        directiveValue.split(";").forEach(part => {
            part = part.trim();

            if (part.startsWith("context") && part.split(":").length > 1) {
                attribs["[" + directiveName + "Context]"] = part.split(":")[1];
            } else {
                attribs["[" + directiveName + "]"] = part.trim();
            }

        })

        return attribs;

    }

    attribs["[" + directiveName + "]"] = directiveValue;

    return attribs;

}
