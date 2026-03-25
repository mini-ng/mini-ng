# ⬅️ Right-Associative (recursion, NOT loop)
Example: =, ?:

```ts
function parseAssignment() {
    let left = this.parseConditional(); // 👈 next level

    if (this.match('=')) {
        const right = this.parseAssignment(); // 👈 recurse SAME level
        return new Assignment(left, right);
    }

    return left;
}
```
🚫 There is no loop for right-associative operators

If you use a loop, you will get the WRONG AST.

# ➡️ Left-Associative (loop)
Example: +, -, ,

```ts
function parseAdditive() {
    let left = this.parseMultiplicative(); // 👈 next level

    while (this.match('+') || this.match('-')) {
        const op = this.previous();
        const right = this.parseMultiplicative(); // 👈 STILL next level
        left = new Binary(left, op, right);
    }

    return left;
}
```
✅ Key points
You always parse the next level (parseMultiplicative)
You loop to keep chaining
You never call yourself

# But for N/A operators

```ts
function parseYield() {
    if (this.match('yield')) {
        const expr = this.parseExpression();
        return new Yield(expr);
    }

    return this.parseNext();
}
```

No loop. No recursion for chaining.

👉 Because:

There is nothing to associate.
