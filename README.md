# Mini-Ng

<p align="center">
  <img src="/logo.png" width="140" alt="Mini-Ng Logo" />
</p>

<p align="center">
  <strong>A JavaScript framework for building component-driven UI.</strong>
</p>

<p align="center">

![npm](https://img.shields.io/npm/v/@mini-ng/core)
![license](https://img.shields.io/npm/l/@mini-ng/core)
![bundle size](https://img.shields.io/bundlephobia/minzip/@mini-ng/core)
![typescript](https://img.shields.io/badge/TypeScript-ready-blue)
![build](https://img.shields.io/github/actions/workflow/status/YOUR_GITHUB_USERNAME/mini-ng/ci.yml)

</p>

---

Mini-Ng is a modern JavaScript framework inspired by the architecture of Angular — designed to be small, understandable, and compiler-friendly.

It is ideal for:

* 🧠 Learning how frameworks work internally
* ⚡ Building lightweight component-based apps
* 🔬 Experimenting with template compilation
* 🏗 Creating custom rendering pipelines

---

# ✨ Features

* Component-based architecture
* Decorator-driven metadata
* Template parsing pipeline
* Selector-based component resolution
* JIT support
* AOT-ready architecture
* Virtual file system compatibility
* Custom bundler integration (Vite / esbuild)

---

# 📦 Installation

```bash
npm install @mini-ng/cli -g

mngc new project_name

cd project_name

npm run start
```

or

```bash
yarn add @mini-ng/cli -g

mngc new project_name

cd project_name

npm run start
```

---

# 🚀 Quick Start

## 1️⃣ Define a Component

```ts
import { Component } from "@mini-ng/core";

@Component({
  selector: "app-root",
  template: `
    <div>Hello world!</div>
  `,
})
export class AppComponent {}
```

---

## 2️⃣ Bootstrap the Application

```ts
import { bootstrapApplication } from "@mini-ng/core";
import { AppComponent } from "./app.component";

bootstrapApplication(AppComponent);
```

That’s it. 🎉

Mini-Ng will:

* Instantiate your root component
* Parse its template
* Compile (if needed)
* Render to the DOM
* Resolve nested components

---

# 🧩 Component API

```ts
@Component({
  selector: string,
  template: string,
  imports?: any[]
})
```

| Property | Description                       |
| -------- | --------------------------------- |
| selector | Custom HTML tag for the component |
| template | HTML template string              |
| imports  | Dependent components              |

---

# 🏗 Architecture

Mini-Ng follows a clean and understandable architecture.

## 🔁 High-Level Flow

```
+-------------------+
|  Component Class  |
+-------------------+
          ↓
+-------------------+
|  Decorator Meta   |
+-------------------+
          ↓
+-------------------+
|  Template Parser  |
+-------------------+
          ↓
+-------------------+
|  Compiler (JIT/AOT)
+-------------------+
          ↓
+-------------------+
|  Render Engine    |
+-------------------+
          ↓
+-------------------+
|      DOM Output   |
+-------------------+
```

---

## 🧠 Internal Pipeline Diagram

```
                ┌────────────────────────┐
                │  @Component Decorator  │
                └────────────┬───────────┘
                             │
                             ▼
                ┌────────────────────────┐
                │ Metadata Registration  │
                └────────────┬───────────┘
                             │
                             ▼
                ┌────────────────────────┐
                │ Template String Input  │
                └────────────┬───────────┘
                             │
                             ▼
                ┌────────────────────────┐
                │ HTML/AST Transformation│
                └────────────┬───────────┘
                             │
                             ▼
                ┌────────────────────────┐
                │ Render Instructions    │
                └────────────┬───────────┘
                             │
                             ▼
                ┌────────────────────────┐
                │ DOM Renderer           │
                └────────────────────────┘
```

---

## 🏎 JIT vs AOT

Mini-Ng supports:

### 🟢 JIT (Just-In-Time)

* Templates parsed at runtime
* Easier debugging
* Ideal for development

### 🔵 AOT (Ahead-Of-Time)

* Templates compiled at build time
* Faster startup
* Smaller runtime
* Production-optimized

The framework is designed to support both without changing the developer API.

---

# 📁 Example Project Structure

```
src/
 ├── main.ts
 ├── app.component.ts
```

### main.ts

```ts
import { bootstrapApplication } from "@mini-ng/core";
import { AppComponent } from "./app.component";

bootstrapApplication(AppComponent);
```

---

# 🛠 Design Philosophy

Mini-Ng is:

* Minimal
* Explicit
* Predictable
* Compiler-first
* Educational but production-capable

It avoids unnecessary abstraction while keeping strong architectural principles.

---

# 🔥 Roadmap

* [ ] Directive system
* [ ] Dependency Injection container
* [ ] Pipe support
* [ ] Change detection strategies
* [ ] Signals-based reactivity
* [ ] DevTools integration
* [ ] SSR support
* [ ] Official CLI

---

# 🤝 Contributing

Contributions are welcome!

You can:

* Open issues
* Suggest improvements
* Submit pull requests
* Propose architectural enhancements

---

# 📜 License

MIT

---

# 🚀 Vision

Mini-Ng is more than a framework.

It is an exploration of how modern UI frameworks like Angular are built internally — from metadata systems to rendering engines and template compilers.

If you love understanding how things work under the hood, Mini-Ng is for you.

---
