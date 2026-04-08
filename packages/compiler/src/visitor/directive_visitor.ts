import * as ts from "typescript";
import {classHasDecorator, ComponentMetadata, createCmpDefinitionPropertiesNode} from "../transformer/transformer";
import {ctx, i0, rf, ɵdir, ɵɵdefineDirective, ɵɵlistener} from "../constants/constants";
import {ExpressionParser} from "../expr_parser/expr_parser";
import {factory} from "typescript";
import {stripQuotes} from "../utils/utils";
import {ImportGenerator} from "../transformer/import-generator/import-generator";

export function hasDirectiveDecorator(node: ts.ClassDeclaration) {
    return classHasDecorator(node, "Directive")
}

export function createDefineDirectiveStatic(
    componentName: string,
    metadata: ComponentMetadata,
    node: ts.Node,
    hoisted: ts.Statement[],
    funcDeclaration: ts.FunctionExpression,
    importManager: ImportGenerator) {
    const f = ts.factory;

    const definitions = createCmpDefinitionPropertiesNode(componentName, metadata, node, hoisted, importManager)
    definitions.push(
        ts.factory.createPropertyAssignment(
            ts.factory.createIdentifier("hostBindings"),
            funcDeclaration
        )
    );

    return f.createPropertyDeclaration(
        [f.createModifier(ts.SyntaxKind.StaticKeyword)],
        ɵdir,
        undefined,
        undefined,
        f.createCallExpression(
            f.createPropertyAccessExpression(
                f.createIdentifier(i0),
                ɵɵdefineDirective,
            ),
            undefined,
            [
                f.createObjectLiteralExpression(
                    definitions,
                    true,
                ),
            ],
        ),
    );
}

export function createHostBinding(node: ts.ClassDeclaration, metadata: ComponentMetadata) {

    const stmts = []
    const updateStmts = []

    if (metadata.host) {

        const properties = (((metadata.host).initializer as ts.ObjectLiteralExpression).properties)

        properties.forEach((property) => {
            if (ts.isPropertyAssignment(property)) {
                const key = (property.name as ts.StringLiteral).text;
                const value = stripQuotes(property.initializer.getText());
                const {createNodes, updateNodes} = parseHostBindings(key.trim(), value);

                stmts.push(...createNodes);
                updateStmts.push(...updateNodes);

            }
        })
    }

    const creationNode = ts.factory.createIfStatement(
        factory.createBinaryExpression(
            ts.factory.createIdentifier("rf"),
            ts.SyntaxKind.AmpersandToken,
            ts.factory.createIdentifier("1")
        ),
        ts.factory.createBlock([...stmts], true),
        undefined
    );

    const updateNode = factory.createIfStatement(
        factory.createBinaryExpression(
            factory.createIdentifier("rf"),
            ts.SyntaxKind.AmpersandToken,
            factory.createIdentifier("2")
        ),
        factory.createBlock([...updateStmts], true),
        undefined
    )

    return ts.factory.createFunctionExpression(
        [],
        undefined,
        node.name.getText() + "_HostBinding",
        undefined,
        [
            ts.factory.createParameterDeclaration(
                undefined,
                undefined,
                rf
            ),
            ts.factory.createParameterDeclaration(
                undefined,
                undefined,
                ctx
            ),
        ],
        null,
        ts.factory.createBlock(
            [creationNode, updateNode],
            true
        )
    )
}

// | Decorator `host` key | Becomes Ivy instruction |
// | -------------------- | ----------------------- |
// | `(event)`            | `ɵɵlistener()`          |
// | `[class.xyz]`        | `ɵɵclassProp()`         |
// | `[attr.xyz]`         | `ɵɵattribute()`         |
// | `[style.xyz]`        | `ɵɵstyleProp()`         |
// | `[prop]`             | `ɵɵproperty()`          |

// if (key.startsWith("(")) → event
// if (key.startsWith("[class.")) → class binding
// if (key.startsWith("[style.")) → style binding
// if (key.startsWith("[")) → property binding

function parseHostBindings(key: string, value: string) {

    const exprParser = ExpressionParser.instance;

    const createNodes = []
    const updateNodes = []

    const firstChar = key[0]
    const lastChar = key[key.length - 1]
    const attrName = key.slice(1, key.length - 1)

    if (firstChar === "(" && lastChar === ")") {
        // listener
        createNodes.push(generateListenerNode(attrName, value));

    } else if (firstChar === "[" && lastChar === "]") {
        // property binding
        const attrParts = attrName.split(".")

        if (attrParts.length > 1) {
            const attrType = attrParts[0]
            const attrValue = attrParts.slice(1).join()

            if (attrType === "class") {
                updateNodes.push(generatePropertyNode("ɵɵclassProp", exprParser, attrValue, value))
            } else if (attrType === "attr") {
                createNodes.push(generatePropertyNode("ɵɵattribute", exprParser, attrValue, value))
            } else if (attrType === "style") {
                updateNodes.push(generatePropertyNode("ɵɵstyleProp", exprParser, attrValue, value))
            } else {
                createNodes.push(generatePropertyNode("ɵɵproperty", exprParser, attrValue, value))
            }
        }
    }

    return { createNodes, updateNodes };

}

export function getTokenExpression(typeNode: ts.TypeReferenceNode, fromMiniNgCore: boolean): ts.Expression {
    const typeName = typeNode.typeName;

    if (ts.isIdentifier(typeName)) {

        if (fromMiniNgCore) {
            return ts.factory.createPropertyAccessExpression(
                ts.factory.createIdentifier(i0),
                ts.factory.createIdentifier(typeName.text)
            )
        }
        return ts.factory.createIdentifier(typeName.text);
    }

    function getTokenExpressionFromQualified(
        name: ts.EntityName
    ): ts.Expression {
        if (ts.isIdentifier(name)) {
            return ts.factory.createIdentifier(name.text);
        }

        if (ts.isQualifiedName(name)) {
            return ts.factory.createPropertyAccessExpression(
                getTokenExpressionFromQualified(name.left),
                name.right.text
            );
        }

        throw new Error("Unsupported qualified name in DI token");
    }

    if (ts.isQualifiedName(typeName)) {
        return ts.factory.createPropertyAccessExpression(
            getTokenExpressionFromQualified(typeName.left),
            typeName.right.text
        );
    }

    throw new Error("Unsupported DI token type");
}

function generatePropertyNode(propertyName: string, exprParser: ExpressionParser, attrValue: string, value: string) {

    return factory.createCallExpression(
        factory.createPropertyAccessExpression(
            factory.createIdentifier(i0),
            factory.createIdentifier(propertyName)
        ),
        undefined,
        [
            ts.factory.createStringLiteral(attrValue),
            exprParser.parseToExpression(value, [])
        ]
    )

}

function generateListenerNode(attrName: string, value: string) {

    const exprParser = ExpressionParser.instance;

    const listenerCall = ts.factory.createCallExpression(
        ts.factory.createPropertyAccessExpression(
            ts.factory.createIdentifier(i0),
            ts.factory.createIdentifier(ɵɵlistener)
        ),
        undefined,
        [
            ts.factory.createStringLiteral(attrName),
            ts.factory.createArrowFunction(
                undefined,
                undefined,
                [
                    ts.factory.createParameterDeclaration(
                        undefined,
                        undefined,
                        '$event'
                    )
                ],
                undefined,
                ts.factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
                ts.factory.createBlock(
                    [
                        ts.factory.createReturnStatement(
                            exprParser.parseToExpression(ts.factory.createIdentifier(value).text, [])
                        )
                    ],
                    true
                )
            )
        ]
    );

    return listenerCall;

}
