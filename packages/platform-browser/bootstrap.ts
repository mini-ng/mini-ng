export function bootstrap(val: Object) {
    console.log(val)
    for (var key in val) {
        if (val.hasOwnProperty(key)) {
            var element = val[key];
            console.log(element)
        }
        console.log(val[key])
    }
}

export function readInComponents(val: string) {
/* 
    <h1>Welcome</h1>
    <to-do></to-do>
 */
var skel = {
    'element': '',
    'attr': [{
        'name': '',
        'value': ''
    }]
}

var start = false
var element = ''
for (var index = 0; index < val.length; index++) {
    if (val[index] == '<' && val[index + 1] != '/') {
        start = true
    }    
    if(start && val[index] != '<' && val[index] != ' ') {
        element += val[index]
    }
    if(val[index] == '>' || val[index] == ' ')
        start = false
}
var el = element.split('>')

/*
var el = document.createElement('html');
el.innerHTML = val;
el.getElementsByTagName('a')
*/

console.log(el);
}

export function DOMtoHTML(params: Array<Object>) {
    /*
        {
            element: '',
            children: [{}],
            attrs: [
                {
                    name: '',
                    value: ''
                }
            ]
        }
        eg:
        [
            {
                element: 'div',
                children: [{
                    element: 'li'
                }]
                attrs: [{
                    name: null,
                    value: null
                }]
            },
            {
                element: 'h1',
                attrs: [{
                    name: null,
                    value: null
                }]
            }
        ]

        =>
        '<div><li></li></div><h1></h1>'
    */
    var html = ''
    params.forEach((p) => {
        html += htmlize(p)
    })

    function htmlize(f){
        return f.type
        //console.log(f.type)
    }
    console.log(html)
}

export function parse(val: string, pi : any) {
    var indexes = [
        {
            loc: [],
            expr: ''
        }
    ]
    var start
    var ast = {
        loc: [],
        expr: ''
    }
    var expr

    for (var index = 0; index < val.length; index++) {
        if (val[index] == '{') {
            start = true
            ast.loc.push(index)
        }
        if(start && val[index] !== '{') {
            expr += val[index]
        }
        if(val[index] == '}') {
            start = false
            ast.loc.push(index)
            indexes.push(ast)
            expr = ''
            ast = {
                loc: [],
                expr: ''
            }
        }
    }
    return compile(val, indexes, pi)

    function compile(val: string, indexes: Array<any>, pi: Object) {
        indexes.forEach((i) => {
            var expr = i.expr
            var loc = i.loc
            //evaluate expr
            for (var key in pi) { 
            }
        })
    }
}

export function compileExpr(tpl, obj) {
    var re = /{([^}]+)?}/g
    var match
    while (match = re.exec(tpl)) {
        console.log(match)        
    }
}










