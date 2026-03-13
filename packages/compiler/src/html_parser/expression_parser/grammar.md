expression
: sequence

sequence
: conditional (',' conditional)*

conditional
: logicalOr ('?' expression ':' expression)?

logicalOr
: logicalAnd ('||' logicalAnd)*

logicalAnd
: equality ('&&' equality)*

equality
: comparison (('=='|'!=') comparison)*

comparison
: additive (('>'|'<'|'>='|'<=' ) additive)*

additive
: multiplicative (('+'|'-') multiplicative)*

multiplicative
: unary (('*'|'/') unary)*

unary
: ('!'|'-'|'+') unary
| pipe

pipe
: call ('|' pipeCall)*

call
: primary
( '(' args ')'
| '.' identifier
| '[' expression ']'
)*

primary
: literal
| identifier
| '(' expression ')'
