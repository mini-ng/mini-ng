# If condition
```html
<ng-if condition="loggedIn">
  <div>Dashboard</div>

  <ng-else>
    <div>Login</div>
  </ng-else>
</ng-if>
```
```html
@if () {
} @elseif () {
} @else {
}

<ng-if condition="loggedIn">
  <div>Dashboard</div>

    <ng-elseif condition="loggedIn">
        User
    </ng-elseif>
    
  <ng-else>
    <div>Login</div>
  </ng-else>
</ng-if>
```

# for
```html
@for () {
}

<ng-for item="user" of="users" trackBy="id">
  <div>{{ user.name }}</div>
</ng-for>
```

# switch

```html
@switch () {

    @case() {
    }

    @default() {
    }

}

<ng-switch condition="status">
  <ng-case value="'loading'">
    <spinner />
  </ng-case>

  <ng-case value="'success'">
    <div>Done</div>
  </ng-case>

  <ng-default>
    <div>Error</div>
  </ng-default>
</ng-switch>
```

# while

```html
<ng-while condition="count < 3">
  <div>Count: {{ count }}</div>
</ng-while>
```
