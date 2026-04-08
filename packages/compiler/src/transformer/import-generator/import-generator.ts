import ts from "typescript";

class AstFactory<T, U> {
}

// class ImportRequest {
//     exportModuleSpecifier: string;
//     exportSymbolName: string;
//     requestedFile: string
// }

// class ImportGenerator {
//     addImport(request: ImportRequest) {
//
//     }
// }

export type ModuleName = string;

export interface ImportRequest {
    module: string;
    name?: string;
    alias?: string;
}

export class ImportGenerator {
    private namedImports = new Map<ModuleName, Map<string, string>>();
    private namespaceImports = new Map<ModuleName, string>();
    private usedNames = new Set<string>();
    private counter = 0;

    addImport(req: ImportRequest): ts.Identifier | ts.PropertyAccessExpression {
        if (!req.name) {
            return this.addNamespaceImport(req.module);
        }

        return this.addNamedImport(req.module, req.name, req.alias);
    }

    finalize(): ts.ImportDeclaration[] {
        const imports: ts.ImportDeclaration[] = [];

        for (const [module, ns] of this.namespaceImports) {
            imports.push(
                ts.factory.createImportDeclaration(
                    undefined,
                    ts.factory.createImportClause(
                        false,
                        undefined,
                        ts.factory.createNamespaceImport(ts.factory.createIdentifier(ns))
                    ),
                    ts.factory.createStringLiteral(module)
                )
            );
        }

        for (const [module, specifiers] of this.namedImports) {
            const elements = Array.from(specifiers.entries()).map(
                ([original, local]) =>
                    ts.factory.createImportSpecifier(
                        false,
                        original !== local ? ts.factory.createIdentifier(original) : undefined,
                        ts.factory.createIdentifier(local)
                    )
            );

            imports.push(
                ts.factory.createImportDeclaration(
                    undefined,
                    ts.factory.createImportClause(
                        false,
                        undefined,
                        ts.factory.createNamedImports(elements)
                    ),
                    ts.factory.createStringLiteral(module)
                )
            );
        }

        console.log(this.namedImports)
        return imports;
    }

    private addNamespaceImport(module: string): ts.Identifier {
        if (this.namespaceImports.has(module)) {
            return ts.factory.createIdentifier(this.namespaceImports.get(module)!);
        }

        const name = this.generateUniqueName("i");
        this.namespaceImports.set(module, name);

        return ts.factory.createIdentifier(name);
    }

    private addNamedImport(
        module: string,
        name: string,
        alias?: string
    ): ts.Identifier {

        if (!this.namedImports.has(module)) {
            this.namedImports.set(module, new Map());
        }

        const map = this.namedImports.get(module)!;

        if (map.has(name)) {
            return ts.factory.createIdentifier(map.get(name)!);
        }

        // ✅ FIX: always ensure uniqueness
        const localName = alias
            ? this.ensureUnique(alias)
            : this.ensureUnique(name);

        map.set(name, localName);

        return ts.factory.createIdentifier(localName);
    }

    private ensureUnique(base: string): string {
        if (!this.usedNames.has(base)) {
            this.usedNames.add(base);
            return base;
        }

        const newName = `${base}_${this.counter++}`;
        this.usedNames.add(newName);
        return newName;
    }

    private generateUniqueName(prefix: string): string {
        let name;
        do {
            name = `${prefix}${this.counter++}`;
        } while (this.usedNames.has(name));

        this.usedNames.add(name);
        return name;
    }
}
