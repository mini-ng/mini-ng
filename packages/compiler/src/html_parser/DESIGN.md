{{ a + b }}

InterpolationNode {
    expression: BinaryExpression (
        lhs: Literal,
        rhs: Literal
    )
}

BindingPipe

Interpolation
    strings
    expression

BoundText = {{}}
    value: ASTWithSource

BoundAttribute = [attrib]
    name
    type
    value: ASTWithSource:
        ast:
    unit

Template if there is a * directive:
    name
    attributes
    inputs
    outputs
    children
    references
    templateAttrs

Element:
    name
    attributes
    inputs
    outputs
    children
    references

