import * as ts from "typescript";
import {i0} from "../constants/constants";
import {ComponentMetadata} from "../transformer/transformer";

export function createDefineInjectableStatic(
    componentName: string,
    metadata: ComponentMetadata,
    node: ts.Node,
    hoisted: ts.Statement[]
) {

// static { this.ɵfac = function ApplicationRef_Factory(t) { return new (t || ApplicationRef)(); }; }
// static { this.ɵprov = /*@__PURE__*/ ɵɵdefineInjectable({ token: ApplicationRef, factory: ApplicationRef.ɵfac, providedIn: 'root' }); }

    const f = ts.factory;

    return f.createPropertyDeclaration(
        [f.createModifier(ts.SyntaxKind.StaticKeyword)],
        "ɵprov",
        undefined,
        undefined,
        f.createCallExpression(
            f.createPropertyAccessExpression(
                f.createIdentifier(i0),
                "ɵɵdefineInjectable",
            ),
            undefined,
            [
                f.createObjectLiteralExpression(
                    [],
                    true,
                ),
            ],
        ),
    );
}
