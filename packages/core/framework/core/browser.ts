export const NAMESPACE_URIS: { [ns: string]: string } = {
  svg: "http://www.w3.org/2000/svg",
  xhtml: "http://www.w3.org/1999/xhtml",
  xlink: "http://www.w3.org/1999/xlink",
  xml: "http://www.w3.org/XML/1998/namespace",
  xmlns: "http://www.w3.org/2000/xmlns/",
  math: "http://www.w3.org/1998/Math/MathML",
};

export class DefaultDomRenderer2 {
  doc: any;
  data: any;

  constructor(doc) {
    this.doc = doc;
    this.data = Object.create(null);
  }

  destroy() {}
  createElement(name, namespace) {
    if (namespace) {
      return this.doc.createElementNS(
        NAMESPACE_URIS[namespace] || namespace,
        name,
      );
    }
    return this.doc.createElement(name);
  }
  createComment(value) {
    return this.doc.createComment(value);
  }
  createText(value) {
    return this.doc.createTextNode(value);
  }
  appendChild(parent, newChild) {
    const targetParent = parent; //isTemplateNode(parent) ? parent.content : parent;
    targetParent.appendChild(newChild);
  }
  insertBefore(parent, newChild, refChild) {
    if (parent) {
      const targetParent = parent; //isTemplateNode(parent) ? parent.content : parent;
      targetParent.insertBefore(newChild, refChild);
    }
  }
  removeChild(parent, oldChild) {
    if (parent) {
      parent.removeChild(oldChild);
    }
  }
  selectRootElement(selectorOrNode, preserveContent) {
    let el =
      typeof selectorOrNode === "string"
        ? this.doc.querySelector(selectorOrNode)
        : selectorOrNode;
    if (!el) {
      throw new Error(`The selector "${selectorOrNode}" did not match any elements`);
      /* ɵRuntimeError(
        -5104 /* RuntimeErrorCode.ROOT_NODE_NOT_FOUND */
    //     (typeof ngDevMode === "undefined" || ngDevMode) &&
    //       `The selector "${selectorOrNode}" did not match any elements`,
    //   );
    }
    if (!preserveContent) {
      el.textContent = "";
    }
    return el;
  }
  parentNode(node) {
    return node.parentNode;
  }
  nextSibling(node) {
    return node.nextSibling;
  }
  setAttribute(el, name, value, namespace) {
    if (namespace) {
      name = namespace + ":" + name;
      const namespaceUri = NAMESPACE_URIS[namespace];
      if (namespaceUri) {
        el.setAttributeNS(namespaceUri, name, value);
      } else {
        el.setAttribute(name, value);
      }
    } else {
      el.setAttribute(name, value);
    }
  }
  removeAttribute(el, name, namespace) {
    if (namespace) {
      const namespaceUri = NAMESPACE_URIS[namespace];
      if (namespaceUri) {
        el.removeAttributeNS(namespaceUri, name);
      } else {
        el.removeAttribute(`${namespace}:${name}`);
      }
    } else {
      el.removeAttribute(name);
    }
  }
  addClass(el, name) {
    el.classList.add(name);
  }
  removeClass(el, name) {
    el.classList.remove(name);
  }
  setStyle(el, style, value, flags) {
    if (
      flags /*&
      (RendererStyleFlags2.DashCase | RendererStyleFlags2.Important)*/
    ) {
    //   el.style.setProperty(
    //     style,
    //     value,
    //     flags & RendererStyleFlags2.Important ? "important" : "",
    //   );
    } else {
      el.style[style] = value;
    }
  }
  removeStyle(el, style, flags) {
    // if (flags & RendererStyleFlags2.DashCase) {
    //   // removeProperty has no effect when used on camelCased properties.
    //   el.style.removeProperty(style);
    // } else {
    //   el.style[style] = "";
    // }
  }
  setProperty(el, name, value) {
    if (el == null) {
      return;
    }
    // (typeof ngDevMode === "undefined" || ngDevMode) &&
    //   this.throwOnSyntheticProps &&
    //   checkNoSyntheticProp(name, "property");
    el[name] = value;
  }
  setValue(node, value) {
    node.nodeValue = value;
  }
  listen(target, event, callback) {
    // (typeof ngDevMode === "undefined" || ngDevMode) &&
    //   this.throwOnSyntheticProps &&
    //   checkNoSyntheticProp(event, "listener");
    // if (typeof target === "string") {
    //   target = ɵgetDOM().getGlobalEventTarget(this.doc, target);
    //   if (!target) {
    //     throw new Error(
    //       `Unsupported event target ${target} for event ${event}`,
    //     );
    //   }
    // }
    // return this.eventManager.addEventListener(
    //   target,
    //   event,
    //   this.decoratePreventDefault(callback),
    // );
  }
  decoratePreventDefault(eventHandler) {
    return (event) => {
      if (event === "__ngUnwrap__") {
        return eventHandler;
      }
      // Run the event handler inside the ngZone because event handlers are not patched
      // by Zone on the server. This is required only for tests.
    //   const allowDefaultBehavior = this.platformIsServer
    //     ? this.ngZone.runGuarded(() => eventHandler(event))
    //     : eventHandler(event);
    //   if (allowDefaultBehavior === false) {
    //     event.preventDefault();
    //   }
      return undefined;
    };
  }
}
