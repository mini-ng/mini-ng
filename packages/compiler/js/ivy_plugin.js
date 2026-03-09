const ts = require("typescript");
const glob = require("glob");

function toKebabCase(str) {
  // Your kebab-case conversion logic here
}

function getInputProperties(componentClass) {
  // Your logic to extract input properties and generate code here
}

function getTemplateInstructions(componentClass) {
  // Your logic to generate template instructions here
}

function getUpdateInstructions(componentClass) {
  // Your logic to generate update instructions here
}

function hasComponentDecorator(node) {
  const decorators = ts.getDecorators(node);
  return (
    decorators &&
    decorators.some(
      (decorator) =>
        ts.isCallExpression(decorator.expression) &&
        ts.isIdentifier(decorator.expression.expression) &&
        decorator.expression.expression.text === "Component"
    )
  );
}

function getComponentDecorator(node) {
  const decorators = ts.getDecorators(node);
  return decorators.find(
    (decorator) =>
      ts.isCallExpression(decorator.expression) &&
      ts.isIdentifier(decorator.expression.expression) &&
      decorator.expression.expression.text === "Component"
  );
}

function transformComponentToIvy(node, context) {
  const componentName = node.name.escapedText;
  const factory = ts.factory;
  const decorator = getComponentDecorator(node);

  //   factory.createExpressionStatement(factory.createBinaryExpression(
  //     factory.createPropertyAccessExpression(
  //       factory.createIdentifier("Ex"),
  //       factory.createIdentifier("sa")
  //     ),
  //     factory.createToken(ts.SyntaxKind.EqualsToken),
  //     factory.createFunctionExpression(
  //       undefined,
  //       undefined,
  //       undefined,
  //       undefined,
  //       [],
  //       undefined,
  //       factory.createBlock(
  //         [factory.createExpressionStatement(factory.createCallExpression(
  //           factory.createPropertyAccessExpression(
  //             factory.createIdentifier("console"),
  //             factory.createIdentifier("log")
  //           ),
  //           undefined,
  //           [factory.createStringLiteral("gdfdfdf")]
  //         ))],
  //         true
  //       )
  //     )
  //   ))

  return (
    factory.createExpressionStatement(factory.createIdentifier("static")),
    factory.createBlock(
      [
        factory.createExpressionStatement(
          factory.createBinaryExpression(
            factory.createPropertyAccessExpression(
              factory.createThis(),
              factory.createIdentifier("ɵcmp")
            ),
            factory.createToken(ts.SyntaxKind.EqualsToken),
            factory.createCallExpression(
              factory.createPropertyAccessExpression(
                factory.createIdentifier("i0"),
                factory.createIdentifier("ɵɵdefineComponent")
              ),
              undefined,
              [
                factory.createObjectLiteralExpression(
                  [
                    factory.createPropertyAssignment(
                      factory.createIdentifier("type"),
                      // componentName
                      //   factory.createIdentifier("ExampleComponent")
                      ts.factory.createIdentifier(componentName)
                    ),
                    factory.createPropertyAssignment(
                      factory.createIdentifier("selectors"),
                      factory.createArrayLiteralExpression(
                        [
                          factory.createArrayLiteralExpression(
                            [factory.createStringLiteral("app-table")],
                            false
                          ),
                        ],
                        false
                      )
                    ),
                    factory.createPropertyAssignment(
                      factory.createIdentifier("standalone"),
                      factory.createTrue()
                    ),
                    factory.createPropertyAssignment(
                      factory.createIdentifier("features"),
                      factory.createArrayLiteralExpression(
                        [
                          factory.createPropertyAccessExpression(
                            factory.createIdentifier("i0"),
                            factory.createIdentifier("ɵɵStandaloneFeature")
                          ),
                        ],
                        false
                      )
                    ),
                    factory.createPropertyAssignment(
                      factory.createIdentifier("decls"),
                      factory.createNumericLiteral("4")
                    ),
                    factory.createPropertyAssignment(
                      factory.createIdentifier("vars"),
                      factory.createNumericLiteral("1")
                    ),
                    factory.createPropertyAssignment(
                      factory.createIdentifier("consts"),
                      factory.createArrayLiteralExpression(
                        [
                          factory.createArrayLiteralExpression(
                            [
                              factory.createNumericLiteral("2"),
                              factory.createStringLiteral("background-color"),
                              factory.createStringLiteral("brown"),
                              factory.createStringLiteral("padding"),
                              factory.createStringLiteral("10px"),
                            ],
                            false
                          ),
                          factory.createArrayLiteralExpression(
                            [
                              factory.createNumericLiteral("3"),
                              factory.createStringLiteral("click"),
                            ],
                            false
                          ),
                        ],
                        true
                      )
                    ),
                    factory.createPropertyAssignment(
                      factory.createIdentifier("template"),
                      factory.createFunctionExpression(
                        undefined,
                        undefined,
                        factory.createIdentifier(componentName + "_Template"),
                        undefined,
                        [
                          factory.createParameterDeclaration(
                            undefined,
                            undefined,
                            factory.createIdentifier("rf"),
                            undefined,
                            undefined,
                            undefined
                          ),
                          factory.createParameterDeclaration(
                            undefined,
                            undefined,
                            factory.createIdentifier("ctx"),
                            undefined,
                            undefined,
                            undefined
                          ),
                        ],
                        undefined,
                        factory.createBlock(
                          [
                            factory.createIfStatement(
                              factory.createBinaryExpression(
                                factory.createIdentifier("rf"),
                                factory.createToken(
                                  ts.SyntaxKind.AmpersandToken
                                ),
                                factory.createNumericLiteral("1")
                              ),
                              factory.createBlock(
                                [
                                  factory.createExpressionStatement(
                                    factory.createCallExpression(
                                      factory.createPropertyAccessExpression(
                                        factory.createIdentifier("i0"),
                                        factory.createIdentifier(
                                          "ɵɵelementStart"
                                        )
                                      ),
                                      undefined,
                                      [
                                        factory.createNumericLiteral("0"),
                                        factory.createStringLiteral("div"),
                                        factory.createNumericLiteral("0"),
                                      ]
                                    )
                                  ),
                                  factory.createExpressionStatement(
                                    factory.createCallExpression(
                                      factory.createPropertyAccessExpression(
                                        factory.createIdentifier("i0"),
                                        factory.createIdentifier("ɵɵtext")
                                      ),
                                      undefined,
                                      [factory.createNumericLiteral("1")]
                                    )
                                  ),
                                  factory.createExpressionStatement(
                                    factory.createCallExpression(
                                      factory.createPropertyAccessExpression(
                                        factory.createIdentifier("i0"),
                                        factory.createIdentifier(
                                          "ɵɵelementStart"
                                        )
                                      ),
                                      undefined,
                                      [
                                        factory.createNumericLiteral("2"),
                                        factory.createStringLiteral("button"),
                                        factory.createNumericLiteral("1"),
                                      ]
                                    )
                                  ),
                                  factory.createExpressionStatement(
                                    factory.createCallExpression(
                                      factory.createPropertyAccessExpression(
                                        factory.createIdentifier("i0"),
                                        factory.createIdentifier("ɵɵlistener")
                                      ),
                                      undefined,
                                      [
                                        factory.createStringLiteral("click"),
                                        factory.createFunctionExpression(
                                          undefined,
                                          undefined,
                                          factory.createIdentifier(
                                            "ExampleComponent_Template_button_click_2_listener"
                                          ),
                                          undefined,
                                          [],
                                          undefined,
                                          factory.createBlock(
                                            [
                                              factory.createReturnStatement(
                                                factory.createCallExpression(
                                                  factory.createPropertyAccessExpression(
                                                    factory.createIdentifier(
                                                      "ctx"
                                                    ),
                                                    factory.createIdentifier(
                                                      "clickHandler"
                                                    )
                                                  ),
                                                  undefined,
                                                  []
                                                )
                                              ),
                                            ],
                                            true
                                          )
                                        ),
                                      ]
                                    )
                                  ),
                                  factory.createExpressionStatement(
                                    factory.createCallExpression(
                                      factory.createPropertyAccessExpression(
                                        factory.createIdentifier("i0"),
                                        factory.createIdentifier("ɵɵtext")
                                      ),
                                      undefined,
                                      [
                                        factory.createNumericLiteral("3"),
                                        factory.createStringLiteral(
                                          "Increment"
                                        ),
                                      ]
                                    )
                                  ),
                                  factory.createExpressionStatement(
                                    factory.createCallExpression(
                                      factory.createCallExpression(
                                        factory.createPropertyAccessExpression(
                                          factory.createIdentifier("i0"),
                                          factory.createIdentifier(
                                            "ɵɵelementEnd"
                                          )
                                        ),
                                        undefined,
                                        []
                                      ),
                                      undefined,
                                      []
                                    )
                                  ),
                                ],
                                true
                              ),
                              undefined
                            ),
                            factory.createIfStatement(
                              factory.createBinaryExpression(
                                factory.createIdentifier("rf"),
                                factory.createToken(
                                  ts.SyntaxKind.AmpersandToken
                                ),
                                factory.createNumericLiteral("2")
                              ),
                              factory.createBlock(
                                [
                                  factory.createExpressionStatement(
                                    factory.createCallExpression(
                                      factory.createPropertyAccessExpression(
                                        factory.createIdentifier("i0"),
                                        factory.createIdentifier("ɵɵadvance")
                                      ),
                                      undefined,
                                      [factory.createNumericLiteral("1")]
                                    )
                                  ),
                                  factory.createExpressionStatement(
                                    factory.createCallExpression(
                                      factory.createPropertyAccessExpression(
                                        factory.createIdentifier("i0"),
                                        factory.createIdentifier(
                                          "ɵɵtextInterpolate1"
                                        )
                                      ),
                                      undefined,
                                      [
                                        factory.createStringLiteral(" "),
                                        factory.createCallExpression(
                                          factory.createPropertyAccessExpression(
                                            factory.createIdentifier("ctx"),
                                            factory.createIdentifier("countSig")
                                          ),
                                          undefined,
                                          []
                                        ),
                                        factory.createStringLiteral(" "),
                                      ]
                                    )
                                  ),
                                ],
                                true
                              ),
                              undefined
                            ),
                          ],
                          true
                        )
                      )
                    ),
                    factory.createPropertyAssignment(
                      factory.createIdentifier("encapsulation"),
                      factory.createNumericLiteral("2")
                    ),
                    factory.createPropertyAssignment(
                      factory.createIdentifier("changeDetection"),
                      factory.createNumericLiteral("0")
                    ),
                  ],
                  true
                ),
              ]
            )
          )
        ),
      ],
      true
    )
  );

  //return node;
}

function transformToIvy(componentClass) {
  const componentName = componentClass.name.text;

  const ivyCode = `
      const i0 = require('@angular/core');
      
      class ${componentName} {
        ${getInputProperties(componentClass)}
        
        static ɵcmp = i0.ɵɵdefineComponent({
          type: ${componentName},
          tag: '${toKebabCase(componentName)}',
          factory: () => new ${componentName}(),
          template: function (rf, ctx) {
            if (rf & i0.RenderFlags.Create) {
              ${getTemplateInstructions(componentClass)}
            }
            if (rf & i0.RenderFlags.Update) {
              ${getUpdateInstructions(componentClass)}
            }
          },
        });
      
        static ɵfac = function ${componentName}_Factory(t) {
          return new (t || ${componentName})();
        };
      }
      
      ${componentName}.ɵprov = i0.ɵɵdefineInjectable({
        token: ${componentName},
        factory: ${componentName}.ɵfac,
      });
      
      exports.${componentName} = ${componentName};
        `;

  return ivyCode;
}

function transformToIvyPlugin(program) {
  return (context) => {
    function visit(node) {
      if (ts.isClassDeclaration(node)) {
        return ts.visitEachChild(node, visit, context);
      }
      if (ts.isClassDeclaration(node) && hasComponentDecorator(node)) {
        return transformComponentToIvy(node, context);
      }

      return ts.visitEachChild(node, visit, context);
    }

    return (sourceFile) => ts.visitNode(sourceFile, visit);
  };
}

// module.exports = transformToIvyPlugin;

process.chdir("/Users/chidumennamdi/Documents/developerse/my-angular/test");

const currentDirectory = process.cwd();
console.log("Current Directory:", currentDirectory);

// const outputDir = path.join(__dirname, "dist");
// fs.mkdirSync(outputDir, { recursive: true });

const tsFiles = glob.sync("src/**/*.ts");

// Usage
const program = ts.createProgram({
  rootNames: tsFiles,
  options: {
    target: ts.ScriptTarget.Latest,
    module: ts.ModuleKind.CommonJS,
    experimentalDecorators: true,
    outDir: "./dist",
  },
});

// const transformToIvy = transformToIvyPlugin(program);
const emitResult = program.emit(undefined, undefined, undefined, undefined, {
  before: [transformToIvyPlugin(program)],
});
