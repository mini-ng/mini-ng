import * as ts from "typescript";
import {factory} from "typescript";
import {i0, ɵɵInputFlags} from "../constants/constants";
import {stripQuotes} from "../utils/utils";

export function extractInputsOutputs(node: ts.ClassDeclaration) {
    const inputs: { key: string; value: ts.Expression; } [] = [];
    const outputs: { key: string; value: ts.Expression; } [] = [];

    for (const member of node.members) {
        if (!ts.isPropertyDeclaration(member)) continue;
        if (!member.name || !ts.isIdentifier(member.name)) continue;

        const decorators = ts.canHaveDecorators(member)
            ? ts.getDecorators(member)
            : undefined;

        if (!decorators) continue;

        for (const dec of decorators) {
            if (isInputOutputDecorator(dec, "Input")) {

                let value;

                if ((dec.expression as ts.CallExpression).arguments?.length) {
                    const _arguments = (dec.expression as ts.CallExpression).arguments;
                    const argExpression = _arguments[0];

                    if (ts.isStringLiteral(argExpression)) {

                        value = ts.factory.createArrayLiteralExpression(
                            [
                                generateInputFlags("None"),
                                ts.factory.createStringLiteral(stripQuotes(argExpression.text)),
                                ts.factory.createStringLiteral(stripQuotes(member.name.text)),
                            ],
                            false
                        )

                    } else if (ts.isObjectLiteralExpression(argExpression)) {
                        const properties = argExpression.properties;

                        let alias
                        let transform
                        let hasDecoratorInputTransform
                        let required
                        let declaredName

                        properties.forEach((property: ts.PropertyAssignment) => {

                            if (property.name.getText() === "alias") {
                                alias = ts.factory.createStringLiteral(stripQuotes(property.initializer.getText().trim()))
                            }

                            if (property.name.getText() === "required") {
                                required = property.initializer.getText()
                            }

                            if (property.name.getText() === "transform") {
                                if (ts.isArrowFunction(property.initializer)) {
                                    const arrowFn = property.initializer as ts.ArrowFunction
                                    hasDecoratorInputTransform = true;
                                    transform = ts.factory.createArrowFunction(
                                        arrowFn.modifiers,
                                        arrowFn.typeParameters,
                                        arrowFn.parameters,
                                        arrowFn.type,
                                        arrowFn.equalsGreaterThanToken,
                                        arrowFn.body
                                    )
                                }

                            }

                        })

                        declaredName = ts.factory.createStringLiteral(stripQuotes(member.name.text));

                        const elements = [ generateInputFlags(hasDecoratorInputTransform ? "HasDecoratorInputTransform" : "None"), alias, declaredName ];
                        if (transform) {
                            elements.push(transform);
                        }


                        value = ts.factory.createArrayLiteralExpression([...elements], false);

                    }

                } else {
                    value = ts.factory.createStringLiteral(stripQuotes(member.name.text));
                }

                const input = {
                    key: member.name.text,
                    value
                }
                inputs.push(input);
                continue;
            }
            if (isInputOutputDecorator(dec, "Output")) {

                let value;

                if ((dec.expression as ts.CallExpression).arguments?.length) {
                    const _arguments = (dec.expression as ts.CallExpression).arguments;
                    const argExpression = _arguments[0];

                    if (ts.isStringLiteral(argExpression)) {

                        value = ts.factory.createArrayLiteralExpression(
                            [
                                generateInputFlags("None"),
                                ts.factory.createStringLiteral(stripQuotes(argExpression.text)),
                                ts.factory.createStringLiteral(stripQuotes(member.name.text)),
                            ],
                            true
                        )

                    }
                }else {
                    value = ts.factory.createStringLiteral(stripQuotes(member.name.text));
                }

                outputs.push({key: member.name.text, value});

            }
        }
    }

    return { inputs, outputs };
}

function isInputOutputDecorator(dec: ts.Decorator, inputOutput: string): boolean {
    const expr = dec.expression;

    if (ts.isIdentifier(expr)) {
        return expr.text === inputOutput;
    }

    if (ts.isCallExpression(expr)) {
        return ts.isIdentifier(expr.expression)
            && expr.expression.text === inputOutput;
    }

    return false;
}

function generateInputFlags(inputType: string) {
    return factory.createPropertyAccessExpression(
        factory.createPropertyAccessExpression(
            factory.createIdentifier(i0),
            factory.createIdentifier(ɵɵInputFlags)
        ),
        factory.createIdentifier(inputType)
    )

}
