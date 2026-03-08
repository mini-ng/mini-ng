import * as ts from "typescript";
import {createTransformer} from "./parse";

export class ExpressionParser {
    static instance: ExpressionParser = new ExpressionParser();

    parse(source: string, implicitVariables: string[]): ts.SourceFile {
        // Create a SourceFile object
        const sourceFile = ts.createSourceFile("__mini_ng_expression_parser.ts", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);

        // Apply the transformation
        const result = ts.transform(sourceFile, [createTransformer("ctx", implicitVariables)]);

        // Get the transformed source file
        const transformedSourceFile = result.transformed[0] as ts.SourceFile;

        // Clean up the transformation result
        result.dispose();

        // Return the transformed SourceFile node
        return transformedSourceFile;
    }

    parseToExpression(source: string, implicitVariables: string[]) {
        const statements =  this.parse(source, implicitVariables).statements

        const stmt = statements[0];

        if (!ts.isExpressionStatement(stmt)) {
            throw new Error('Not a valid expression');
        }

        // @ts-ignore
        return statements[0].expression;
    }

}
