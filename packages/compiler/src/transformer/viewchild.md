```
ViewChild(
selector: ProviderToken<unknown> | Function | string, 
opts?: {read?: any, static?: boolean}
): any
```

Property decorator that configures a view query. The change detector looks for the first element or the directive matching the selector in the view DOM. If the view DOM changes, and a new child matches the selector, the property is updated.
Metadata Properties:
- selector - The directive type or the name used for querying.
- read - Used to read a different token from the queried elements.
- static - true to resolve query results before change detection runs, false to resolve after change detection. Defaults to false.

- The following selectors are supported.
Any class with the @Component or @Directive decorator
A template reference variable as a string (e. g. query <my-component #cmp></ my-component> with @ViewChild('cmp'))
Any provider defined in the child component tree of the current component (e. g. @ViewChild(SomeService) someService: SomeService)
Any provider defined through a string token (e. g. @ViewChild('someToken') someTokenVal: any)
A TemplateRef (e. g. query <ng-template></ ng-template> with @ViewChild(TemplateRef) template;)
The following values are supported by read:
Any class with the @Component or @Directive decorator
Any provider defined on the injector of the component that is matched by the selector of this query
Any provider defined through a string token (e. g. {provide: 'token', useValue: 'val'})
TemplateRef, ElementRef, and ViewContainerRef
Difference between dynamic and static queries:
Dynamic queries (static: false) - The query resolves before the ngAfterViewInit() callback is called. The result will be updated for changes to your view, such as changes to ngIf and ngFor blocks.
Static queries (static: true) - The query resolves once the view has been created, but before change detection runs (before the ngOnInit() callback is called). The result, though, will never be updated to reflect changes to your view, such as changes to ngIf and ngFor blocks.

```ts
let _t;
let _index = 0;
i0.ɵɵqueryRefresh(_index, _t = i0.ɵɵloadQuery(_index)) && (ctx.alertBox = _t.first);
_index++
i0.ɵɵqueryRefresh(_t = i0.ɵɵloadQuery()) && (ctx.children = _t);

```
