{MORE:more|less}

before {C:D} after 

base
* one 
one more child
than you {C:D} expect 
yes siree
hello world
** two
two children
-- gather two
- gather one
and then {A:B} there's more

{DEBUG:
hello freddie
- else: hello world
}

{DEBUG:hello freddie}
{DEBUG:hello freddie|hello world}
{MORE:more|less}
{ANSWER:
-0 : nothing
- 42: deep thought
- else: no answer yet
}

=== indentTest1 ===
base
* one #foo #bar baz #qux
one {MORE:more|less} child
than you would expect
** two
two {RANDOM(1, RANDOM(2,6))} children
+++ {condition} (label) three
three child
~ foo = "hello world"
~ doSomething(foo)
and then we end
- -> DONE
*/
