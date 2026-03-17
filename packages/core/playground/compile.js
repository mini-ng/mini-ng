/** Author : Chidume Nnamdi*/
var __decorate =
  (this && this.__decorate) ||
  function (decorators, target, key, desc) {
    var c = arguments.length,
      r =
        c < 3
          ? target
          : desc === null
          ? (desc = Object.getOwnPropertyDescriptor(target, key))
          : desc,
      d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function")
      r = Reflect.decorate(decorators, target, key, desc);
    else
      for (var i = decorators.length - 1; i >= 0; i--)
        if ((d = decorators[i]))
          r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
  };
var compTree = {};
var compList = [];
var rootCompo;
var html = "";

function bootstrap(params) {
  rootCompo = params[0];
  compListToCompTree(params);
  var events = ["click", "keydown", "keyup", "hover"];
  events.forEach(function (event) {
    addEventListener(event, function myFunc() {
      myFunc.apply(this, arguments);
    });
  });
  document.getElementsByTagName("app-root")[0].innerHTML = html;
}
/** parse the compos array to compo tree */
function compListToCompTree(params) {
  var allsel = {};
  compList.forEach(function (l) {
    allsel[l.selector] = l;
  });
  compList.forEach(function (l) {
    compTree[l.selector] = l.selector;
  });
  html = compList[0].template;
  var still = checkForComo(html);
  while (checkForComo(html)) {
    var res = [];
    var arrayOfHtml = [];
    for (var key in allsel) {
      var k = new RegExp("<" + key + ">", "g");
      var match;
      while ((match = k.exec(html)) != null) {
        var sp = match[0] + "</" + key + ">";
        var d = html.split(sp);
        arrayOfHtml.push(d[0]);
        arrayOfHtml.push(match[0]);
        html = html.replace(d[0] + match[0] + "</" + key + ">", "");
        k.exec(html);
      }
    }
    var chtml = "";
    arrayOfHtml.forEach(function (h) {
      var isCompo = false;
      var el;
      for (var key in allsel) {
        var f = "<" + key + ">";
        if (f == h) {
          isCompo = true;
          el = key;
        }
      }
      if (isCompo) {
        chtml += allsel[el].template;
      } else {
        chtml += h;
      }
    });
    html = chtml;
  }
  console.log(html);
  function checkForComo(v) {
    var match = false;
    for (var key in allsel) {
      var k = new RegExp("<" + key + ">");
      var res = v.match(k);
      if (res != null) return (match = true);
    }
    return match;
  }
}
function Component(val) {
  return function (target) {
    var el = {
      selector: "",
      template: "",
      class: null,
    };
    for (var key in val) {
      el[key] = val[key];
    }
    el["class"] = target;
    compList.push(el);
    target.prototype.greet = function () {};
  };
}
/** App starts here */
var AppComp = (function () {
  function AppComp() {
    this.a = 9;
  }
  AppComp = __decorate(
    [
      Component({
        selector: "app-root",
        template: "\n    <h1>Hello App-Root</h1>\n    <todo></todo>",
      }),
    ],
    AppComp
  );
  return AppComp;
})();
var Todo = (function () {
  function Todo() {
    this.a = 9;
  }
  Todo = __decorate(
    [
      Component({
        selector: "todo",
        template: "\n    <h2>ToDos App</h2>\n    <todo-list></todo-list>",
      }),
    ],
    Todo
  );
  return Todo;
})();
var TodoList = (function () {
  function TodoList() {
    this.a = 9;
  }
  TodoList = __decorate(
    [
      Component({
        selector: "todo-list",
        template:
          "\n    <ul>\n        <li>Eat</li>\n        <li>Sleep</li>\n        <li>Code</li>\n    </ul>",
      }),
    ],
    TodoList
  );
  return TodoList;
})();
bootstrap([AppComp, Todo]);
