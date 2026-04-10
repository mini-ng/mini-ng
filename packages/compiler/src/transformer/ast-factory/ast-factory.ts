import ts from "typescript";

type BinaryOperator =
    | '+' | '-' | '*' | '/' | '%' | '**'
    | '&&' | '||' | '??'
    | '==' | '===' | '!=' | '!=='
    | '<' | '<=' | '>' | '>='
    | '=' | '+=' | '-=' | '*=' | '/=';

type UnaryOperator = '+' | '-' | '!';

type VariableDeclarationType = 'const' | 'let' | 'var';

type ObjectLiteralProperty<T> =
    | { kind: 'property'; propertyName: string; value: T; quoted?: boolean }
    | { kind: 'spread'; expression: T };

type TemplateElement = {
    cooked: string;
    raw: string;
};

type TemplateLiteral<T> = {
    elements: TemplateElement[];
    expressions: T[];
};

export class AstFactory {
    
    private BIN_OPS: Record<BinaryOperator, ts.BinaryOperator> = {
        '+': ts.SyntaxKind.PlusToken,
        '-': ts.SyntaxKind.MinusToken,
        '*': ts.SyntaxKind.AsteriskToken,
        '/': ts.SyntaxKind.SlashToken,
        '%': ts.SyntaxKind.PercentToken,
        '**': ts.SyntaxKind.AsteriskAsteriskToken,
        '&&': ts.SyntaxKind.AmpersandAmpersandToken,
        '||': ts.SyntaxKind.BarBarToken,
        '??': ts.SyntaxKind.QuestionQuestionToken,
        '==': ts.SyntaxKind.EqualsEqualsToken,
        '===': ts.SyntaxKind.EqualsEqualsEqualsToken,
        '!=': ts.SyntaxKind.ExclamationEqualsToken,
        '!==': ts.SyntaxKind.ExclamationEqualsEqualsToken,
        '<': ts.SyntaxKind.LessThanToken,
        '<=': ts.SyntaxKind.LessThanEqualsToken,
        '>': ts.SyntaxKind.GreaterThanToken,
        '>=': ts.SyntaxKind.GreaterThanEqualsToken,
        '=': ts.SyntaxKind.EqualsToken,
        '+=': ts.SyntaxKind.PlusEqualsToken,
        '-=': ts.SyntaxKind.MinusEqualsToken,
        '*=': ts.SyntaxKind.AsteriskEqualsToken,
        '/=': ts.SyntaxKind.SlashEqualsToken,
    };

    private UNARY_OPS: Record<UnaryOperator, ts.PrefixUnaryOperator> = {
        '+': ts.SyntaxKind.PlusToken,
        '-': ts.SyntaxKind.MinusToken,
        '!': ts.SyntaxKind.ExclamationToken,
    };

    private VAR_TYPES: Record<VariableDeclarationType, ts.NodeFlags> = {
        const: ts.NodeFlags.Const,
        let: ts.NodeFlags.Let,
        var: ts.NodeFlags.None,
    };
    
    createIdentifier(name: string) {
        return ts.factory.createIdentifier(name);
    }

    createLiteral(value: any): ts.Expression {
        if (value === null) return ts.factory.createNull();
        if (value === undefined) return ts.factory.createIdentifier("undefined");
        if (typeof value === "boolean") return value ? ts.factory.createTrue() : ts.factory.createFalse();
        if (typeof value === "number") return ts.factory.createNumericLiteral(value);
        return ts.factory.createStringLiteral(String(value));
    }

    createArrayLiteral(elements: ts.Expression[]) {
        return ts.factory.createArrayLiteralExpression(elements);
    }

    createObjectLiteral(properties: ObjectLiteralProperty<ts.Expression>[]) {
        return ts.factory.createObjectLiteralExpression(
            properties.map(p =>
                p.kind === 'spread'
                    ? ts.factory.createSpreadAssignment(p.expression)
                    : ts.factory.createPropertyAssignment(
                        p.quoted
                            ? ts.factory.createStringLiteral(p.propertyName)
                            : ts.factory.createIdentifier(p.propertyName),
                        p.value
                    )
            )
        );
    }
    
    createBinary(left: ts.Expression, op: BinaryOperator, right: ts.Expression) {
        return ts.factory.createBinaryExpression(left, this.BIN_OPS[op], right);
    }

    createAssignment(target: ts.Expression, op: BinaryOperator, value: ts.Expression) {
        return this.createBinary(target, op, value);
    }

    createUnary(op: UnaryOperator, expr: ts.Expression) {
        return ts.factory.createPrefixUnaryExpression(this.UNARY_OPS[op], expr);
    }

    createConditional(cond: ts.Expression, t: ts.Expression, f: ts.Expression) {
        return ts.factory.createConditionalExpression(cond, undefined, t, undefined, f);
    }

    createCallExpression(fn: ts.Expression, args: ts.Expression[], pure = false) {

        const call = ts.factory.createCallExpression(fn, undefined, args);

        if (pure) {
            ts.addSyntheticLeadingComment(
                call,
                ts.SyntaxKind.MultiLineCommentTrivia,
                "@__PURE__",
                false
            );
        }

        return call;
    }

    createNew(expr: ts.Expression, args: ts.Expression[]) {
        return ts.factory.createNewExpression(expr, undefined, args);
    }

    createPropertyAccess(obj: ts.Expression, prop: string) {
        return ts.factory.createPropertyAccessExpression(obj, prop);
    }

    createElementAccess(obj: ts.Expression, index: ts.Expression) {
        return ts.factory.createElementAccessExpression(obj, index);
    }

    createParenthesized(expr: ts.Expression) {
        return ts.factory.createParenthesizedExpression(expr);
    }

    createSpread(expr: ts.Expression) {
        return ts.factory.createSpreadElement(expr);
    }

    createTypeOf(expr: ts.Expression) {
        return ts.factory.createTypeOfExpression(expr);
    }

    createVoid(expr: ts.Expression) {
        return ts.factory.createVoidExpression(expr);
    }

    createRegex(body: string, flags?: string) {
        return ts.factory.createRegularExpressionLiteral(`/${body}/${flags ?? ""}`);
    }

    createDynamicImport(url: string | ts.Expression) {
        return ts.factory.createCallExpression(
            ts.factory.createToken(ts.SyntaxKind.ImportKeyword) as any,
            undefined,
            [typeof url === "string" ? ts.factory.createStringLiteral(url) : url]
        );
    }
    
    createExpressionStatement(expr: ts.Expression) {
        return ts.factory.createExpressionStatement(expr);
    }

    createReturn(expr?: ts.Expression | null) {
        return ts.factory.createReturnStatement(expr ?? undefined);
    }

    createThrow(expr: ts.Expression) {
        return ts.factory.createThrowStatement(expr);
    }

    createBlock(statements: ts.Statement[]) {
        return ts.factory.createBlock(statements, true);
    }

    createIf(cond: ts.Expression, thenStmt: ts.Statement, elseStmt?: ts.Statement | null) {
        return ts.factory.createIfStatement(cond, thenStmt, elseStmt ?? undefined);
    }
    
    createVariable(name: string, init: ts.Expression | null, kind: VariableDeclarationType) {
        return ts.factory.createVariableStatement(
            undefined,
            ts.factory.createVariableDeclarationList(
                [ts.factory.createVariableDeclaration(name, undefined, undefined, init ?? undefined)],
                this.VAR_TYPES[kind]
            )
        );
    }

    createFunctionExpression(name: string, params: string[], body: ts.Statement[]) {
        return ts.factory.createFunctionExpression(
            undefined,
            undefined,
            name,
            undefined,
            params.map(p => ts.factory.createParameterDeclaration(undefined, undefined, p)),
            undefined,
            ts.factory.createBlock(body, true)
        );
    }

    createFunctionExpr(name: string | null, params: string[], body: ts.Statement[]) {
        return ts.factory.createFunctionExpression(
            undefined,
            undefined,
            name ?? undefined,
            undefined,
            params.map(p => ts.factory.createParameterDeclaration(undefined, undefined, p)),
            undefined,
            ts.factory.createBlock(body, true)
        );
    }

    createArrow(params: string[], body: ts.Statement[] | ts.Expression) {
        return ts.factory.createArrowFunction(
            undefined,
            undefined,
            params.map(p => ts.factory.createParameterDeclaration(undefined, undefined, p)),
            undefined,
            undefined,
            Array.isArray(body) ? ts.factory.createBlock(body, true) : body
        );
    }
    
    createTemplateLiteral(t: TemplateLiteral<ts.Expression>) {
        if (t.elements.length === 1) {
            return ts.factory.createNoSubstitutionTemplateLiteral(t.elements[0].cooked);
        }

        const spans: ts.TemplateSpan[] = [];

        for (let i = 1; i < t.elements.length; i++) {
            spans.push(
                ts.factory.createTemplateSpan(
                    t.expressions[i - 1],
                    i === t.elements.length - 1
                        ? ts.factory.createTemplateTail(t.elements[i].cooked)
                        : ts.factory.createTemplateMiddle(t.elements[i].cooked)
                )
            );
        }

        return ts.factory.createTemplateExpression(
            ts.factory.createTemplateHead(t.elements[0].cooked),
            spans
        );
    }

    createTaggedTemplate(tag: ts.Expression, template: TemplateLiteral<ts.Expression>) {
        return ts.factory.createTaggedTemplateExpression(
            tag,
            undefined,
            this.createTemplateLiteral(template)
        );
    }

    createReturnStatement(expression: ts.Expression | null) {
        return ts.factory.createReturnStatement(expression ?? undefined);
    }

    createFunctionStatement(s: string, params: string[], statements: ts.Statement[]) {
        return ts.factory.createFunctionDeclaration(
            undefined,
            undefined,
            s,
            undefined,
            params.map(p => ts.factory.createParameterDeclaration(undefined, undefined, p)),
            undefined,
            ts.factory.createBlock(statements, true)
        )
    }
}
