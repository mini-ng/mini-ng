// static {
//     this.ɵfac = function AsyncPipe_Factory(t) {
//         return new (t || AsyncPipe)(i0.ɵɵdirectiveInject(i0.ChangeDetectorRef, 16));
//     };
// }
// static {
//     this.ɵpipe = /* @__PURE__ */i0.ɵɵdefinePipe({
//         name: "async",
//         type: AsyncPipe,
//         pure: false,
//         standalone: true
//     });
// }

import {ComponentMetadata} from "../transformer/transformer";
import * as ts from "typescript";
import {i0} from "../constants/constants";
import {ImportGenerator} from "../transformer/import-generator/import-generator";

export function createDefinePipeStatic(
    componentName: string,
    metadata: ComponentMetadata,
    node: ts.Node,
    hoisted: ts.Statement[],
    importManager: ImportGenerator) {

    const f = ts.factory;

    const type = ts.factory.createPropertyAssignment(
        ts.factory.createIdentifier("type"),
        ts.factory.createIdentifier(componentName)
    )

    const name = ts.factory.createPropertyAssignment(
        ts.factory.createIdentifier("name"),
        ts.factory.createIdentifier(metadata.name.initializer.getText())
    )


    return f.createPropertyDeclaration(
        [f.createModifier(ts.SyntaxKind.StaticKeyword)],
        "ɵpipe",
        undefined,
        undefined,
        f.createCallExpression(
            f.createPropertyAccessExpression(
                f.createIdentifier(i0),
                "ɵɵdefinePipe",
            ),
            undefined,
            [
                f.createObjectLiteralExpression(
                    [type, name],
                    true,
                ),
            ],
        ),
    );
}
