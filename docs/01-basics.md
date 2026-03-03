# 1 — Basics

Overview

- mini-ng is a lightweight component framework and compiler. It provides a runtime in `core/` and a TypeScript transform-based compiler in `compiler/`.

Install & Local dev

- From the repo root run:

```bash
npm install
# Run the compiler against the sample project
node ./compiler/dist/main.js
```

Quickstart (authoring components)

1. Create a component using a class + decorator (TypeScript):

```ts
import { Component } from "@mini-ng/core";

@Component({
  selector: "my-app",
  template: `<div>Hello {{ name }}</div>`,
})
class AppComponent {
  name = "mini-ng";
}

export default AppComponent;
```

2. Compile with the mini-ng compiler (see Compiler section) which emits static definitions (`ɵcmp`) and factory helpers used by the runtime.

Where to look

- Runtime APIs: `core/framework/core` and related files.
- Compiler plugin: `compiler/src/visitor/visitor.ts` and `compiler/src/transformer`.
