// import {Assignment, Binary, Conditional} from "../ast/ast-impl";
// import {Token, TokenType} from "./tokens";
//
// class ParserV2 {
//
//     index = 0;
//
//     constructor(public tokens: Token[]) {}
//
//     public static instance(tokens: Token[]) {
//
//         return (new ParserV2(tokens))
//
//     }
//
//     parseExpression() {
//         return this.parsePipe();
//     }
//
//     parsePipe() {
//         let expr = this.parseAssignment(); // or lower
//
//         while (this.match("|")) {
//             const name = this.consumeIdentifier();
//
//             const args = [];
//             while (this.match(":")) {
//                 args.push(this.parseExpression());
//             }
//
//             expr = new Pipe(expr, name, args);
//         }
//
//         return expr;
//     }
//
//     parseAssignment() {
//         let left = this.parseConditional();
//
//         if (this.match("=", "+=", "-=", "*=", "/=", "%=",
//             "<<=", ">>=", ">>>=", "&=", "^=", "|=",
//             "&&=", "||=", "??=")) {
//
//             const op = this.previous();
//             const right = this.parseAssignment(); // RIGHT
//
//             return new Assignment(left, op, right);
//         }
//
//         return left;
//     }
//
//     parsePostfix() {
//         let expr = this.parseLeftHandSide();
//
//         if (this.match("++", "--")) {
//             return new Update(this.previous(), expr, false);
//         }
//
//         return expr;
//     }
//
//     parseUnary() {
//         if (this.match("!", "~", "+", "-", "typeof", "void", "delete", "await")) {
//             return new Unary(this.previous(), this.parseUnary());
//         }
//
//         if (this.match("++", "--")) {
//             return new Update(this.previous(), this.parseUnary(), true);
//         }
//
//         return this.parsePostfix();
//     }
//
//     parseExponent() {
//         let expr = this.parseUnary();
//
//         if (this.match("**")) {
//             const right = this.parseExponent(); // RIGHT
//             return new Binary(expr, "**", right);
//         }
//
//         return expr;
//     }
//
//     parseAdditive() {
//         let expr = this.parseMultiplicative();
//
//         while (this.match("+", "-")) {
//             const right = this.parseMultiplicative();
//             expr = new Binary(expr, this.previous(), right);
//         }
//
//         return expr;
//     }
//
//     parseMultiplicative() {
//         let expr = this.parseExponent();
//
//         while (this.match("*", "/", "%")) {
//             const right = this.parseExponent();
//             expr = new Binary(expr, this.previous(), right);
//         }
//
//         return expr;
//     }
//
//     parseShift() {
//         let expr = this.parseAdditive();
//
//         while (this.match("<<", ">>", ">>>")) {
//             const right = this.parseAdditive();
//             expr = new Binary(expr, this.previous(), right);
//         }
//
//         return expr;
//     }
//
//     parseEquality() {
//         let expr = this.parseRelational();
//
//         while (this.match("==", "!=", "===", "!==")) {
//             const op = this.previous();
//             const right = this.parseRelational();
//             expr = new Binary(expr, op, right);
//         }
//
//         return expr;
//     }
//
//     parseRelational() {
//         let expr = this.parseShift();
//
//         while (this.match("<", "<=", ">", ">=", "in", "instanceof")) {
//             const op = this.previous();
//             const right = this.parseShift();
//             expr = new Binary(expr, op, right);
//         }
//
//         return expr;
//     }
//
//     parseBitwiseOr() {
//         let expr = this.parseBitwiseXor();
//         while (this.match("|")) {
//             expr = new Binary(expr, "|", this.parseBitwiseXor());
//         }
//         return expr;
//     }
//
//     parseBitwiseXor() {
//         let expr = this.parseBitwiseAnd();
//         while (this.match("^")) {
//             expr = new Binary(expr, "^", this.parseBitwiseAnd());
//         }
//         return expr;
//     }
//
//     parseBitwiseAnd() {
//         let expr = this.parseEquality();
//         while (this.match("&")) {
//             expr = new Binary(expr, "&", this.parseEquality());
//         }
//         return expr;
//     }
//
//     parseLogicalOr() {
//         let expr = this.parseLogicalAnd();
//
//         while (this.match("||")) {
//             const right = this.parseLogicalAnd();
//             expr = new Binary(expr, "||", right);
//         }
//
//         return expr;
//     }
//
//     parseLogicalAnd() {
//         let expr = this.parseBitwiseOr();
//
//         while (this.match("&&")) {
//             const right = this.parseBitwiseOr();
//             expr = new Binary(expr, "&&", right);
//         }
//
//         return expr;
//     }
//
//     parseNullish() {
//         let expr = this.parseLogicalOr();
//
//         while (this.match("??")) {
//             const right = this.parseLogicalOr();
//             expr = new Binary(expr, "??", right);
//         }
//
//         return expr;
//     }
//
//     parseConditional() {
//         let test = this.parseNullish();
//
//         if (this.match("?")) {
//             const cons = this.parseExpression();
//             this.consume(":");
//             const alt = this.parseConditional(); // RIGHT
//
//             return new Conditional(test, cons, alt);
//         }
//
//         return test;
//     }
//
//     parseLeftHandSide() {
//         let expr = this.parsePrimary();
//
//         while (true) {
//             // a.b
//             if (this.match(".")) {
//                 const prop = this.consumeIdentifier();
//                 expr = new Member(expr, prop);
//             }
//
//             // a?.b
//             else if (this.match("?.")) {
//                 const prop = this.consumeIdentifier();
//                 expr = new SafeMember(expr, prop);
//             }
//
//             // a[b]
//             else if (this.match("[")) {
//                 const prop = this.parseExpression();
//                 this.consume("]");
//                 expr = new Member(expr, prop, true);
//             }
//
//             // a[b]?.c
//             else if (this.match("?[")) {
//                 const prop = this.parseExpression();
//                 this.consume("]");
//                 expr = new SafeMember(expr, prop, true);
//             }
//
//             // a()
//             else if (this.match("(")) {
//                 const args = this.parseArguments();
//                 expr = new Call(expr, args);
//             }
//
//             // a?.()
//             else if (this.match("?.(")) {
//                 const args = this.parseArguments();
//                 expr = new SafeCall(expr, args);
//             } else {
//                 break;
//             }
//         }
//
//         return expr;
//     }
//
//     parsePrimary() {
//         if (this.match("NUMBER")) return new Literal(this.previous());
//         if (this.match("STRING")) return new Literal(this.previous());
//
//         if (this.match("IDENTIFIER")) {
//             return new Identifier(this.previous());
//         }
//
//         if (this.match("(")) {
//             const expr = this.parseExpression();
//             this.consume(")");
//             return expr;
//         }
//
//         throw new Error("Unexpected token");
//     }
//
//     parseComma() {
//         let expr = this.parseAssignment();
//
//         while (this.match(",")) {
//             const right = this.parseAssignment();
//             expr = new Binary(expr, ",", right);
//         }
//
//         return expr;
//     }
//
//     match(type: TokenType): boolean {
//
//         if (this.check(type)) {
//             this.advance();
//             return true;
//         }
//
//         return false;
//     }
//
//     check(type: TokenType): boolean {
//
//         if (this.isAtEnd()) return false;
//
//         return this.peek().token === type;
//     }
//
//     advance() {
//         if (!this.isAtEnd()) this.index++;
//     }
//
//     consumeType(type: TokenType, errorMsg: string) {
//
//         if (this.check(type)) {
//             this.advance();
//             return;
//         }
//
//         throw new Error(errorMsg);
//     }
//
//     consume(type: TokenType, errorMsg: string) {
//         this.consumeType(type, errorMsg)
//     }
//
//     previous() {
//         return this.tokens[this.index - 1];
//     }
//
//     peek(): Token {
//         return this.tokens[this.index];
//     }
//
//     isAtEnd(): boolean {
//         return this.index >= this.tokens.length;
//     }
//
//     consumeIdentifier() {
//         const token = this.peek();
//
//         if (this.check(token.token)) {
//             this.advance()
//         } else {
//             throw "Unexpected token";
//         }
//     }
// }
