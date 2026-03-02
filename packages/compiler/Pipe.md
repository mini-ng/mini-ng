# Pipe

{{ expression_or_string | pipe1 | pipe2 ... | pipeN }}

The first thing must either an expression or a text node followed by a | symbol. 

After the first | symbol we can chain as many pipes as we can.

We can represent it as:

<ng-pipe-chain
    expr="expression_or_string"
    pipe1="pipe"
    pipe2="pipe2"
/>
