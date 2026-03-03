# Mini-Ng

![](/logo.png)

A JavaScript framework.

# How it works

Components are JavaScript classes decorated with the `Component` metadata.

The Component decorator provides the metadata that describes a component.

It provides:

- The selector of the component
- The template
- The imports

Mini-Ng has decorators:
- Component

# Component

```ts

import { Component } from "@mini-ng/core";

@Component({
  selector: "app-root",
  template: `
    <div>Hello world!</div>
  `,
})
export class AppComponent {
}
```

# Bootstrapping

```ts
import { bootstrapApplication } from "@mini-ng/core";

...

bootstrapApplication(AppComponent);

```
