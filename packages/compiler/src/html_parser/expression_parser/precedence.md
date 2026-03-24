Level 20 (Highest)
associativity: LEFT
operators:
MemberAccess        -> a.b
OptionalChaining    -> a?.b
ComputedMember      -> a[b]
Call                -> a()
NewWithArgs         -> new A()

-------------------------------------

Level 19
associativity: RIGHT
operators:
NewWithoutArgs      -> new A

-------------------------------------

Level 18
associativity: RIGHT
operators:
PostfixIncrement    -> a++
PostfixDecrement    -> a--

-------------------------------------

Level 17
associativity: RIGHT
operators:
PrefixIncrement     -> ++a
PrefixDecrement     -> --a
UnaryPlus           -> +a
UnaryMinus          -> -a
LogicalNot          -> !a
BitwiseNot          -> ~a
Typeof              -> typeof a
Void                -> void a
Delete              -> delete a
Await               -> await a

-------------------------------------

Level 16
associativity: RIGHT
operators:
Exponentiation      -> a ** b

-------------------------------------

Level 15
associativity: LEFT
operators:
Multiplication      -> a * b
Division            -> a / b
Remainder           -> a % b

-------------------------------------

Level 14
associativity: LEFT
operators:
Addition            -> a + b
Subtraction         -> a - b

-------------------------------------

Level 13
associativity: LEFT
operators:
BitwiseShiftLeft    -> a << b
BitwiseShiftRight   -> a >> b
UnsignedShiftRight  -> a >>> b

-------------------------------------

Level 12
associativity: LEFT
operators:
LessThan            -> a < b
LessEqual           -> a <= b
GreaterThan         -> a > b
GreaterEqual        -> a >= b
In                  -> a in b
InstanceOf          -> a instanceof b

-------------------------------------

Level 11
associativity: LEFT
operators:
Equality            -> a == b
Inequality          -> a != b
StrictEqual         -> a === b
StrictNotEqual      -> a !== b

-------------------------------------

Level 10
associativity: LEFT
operators:
BitwiseAND          -> a & b

-------------------------------------

Level 9
associativity: LEFT
operators:
BitwiseXOR          -> a ^ b

-------------------------------------

Level 8
associativity: LEFT
operators:
BitwiseOR           -> a | b

-------------------------------------

Level 7
associativity: LEFT
operators:
LogicalAND          -> a && b

-------------------------------------

Level 6
associativity: LEFT
operators:
LogicalOR           -> a || b

-------------------------------------

Level 5
associativity: LEFT
operators:
NullishCoalescing   -> a ?? b

NOTE:
?? cannot mix with && or || without parentheses

-------------------------------------

Level 4
associativity: RIGHT
operators:
Conditional         -> a ? b : c

-------------------------------------

Level 3
associativity: RIGHT
operators:
Assignment:
=, +=, -=, *=, /=, %=,
<<=, >>=, >>>=,
&=, ^=, |=,
&&=, ||=, ??=
ArrowFunction       -> (a) => b

-------------------------------------

Level 2
associativity: LEFT
operators:
Yield               -> yield
YieldStar           -> yield*

-------------------------------------

Level 1 (Lowest)
associativity: LEFT
operators:
Comma               -> a, b
                                                                    
