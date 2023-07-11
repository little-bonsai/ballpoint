/* IMPORTANT
 * This snapshot file is auto-generated, but designed for humans.
 * It should be checked into source control and tracked carefully.
 * Re-generate by setting TAP_SNAPSHOT=1 and running tests.
 * Make sure to inspect the output below.  Do not ignore changes!
 */
'use strict'
exports[`test/conditionals.js TAP conditionals bare switch case divert > snap 1`] = `
=== Knot1 ===
    hello one


=== Knot2 ===
    hello two


=== Knot3 ===
    hello three
    {
        - "a" == "b": -> Knot1
        - "a" == "c": -> Knot2
        - "a" == "d": -> Knot3
    }
`

exports[`test/conditionals.js TAP conditionals bare switch case logic > snap 1`] = `
{
    - RANDOM(0, 1) == 0: ~ return true
    - RANDOM(0, 1) == 42: ~ return "deep thought"
    - else: ~ return false
}
`

exports[`test/conditionals.js TAP conditionals condition based on nested path > snap 1`] = `
"I've done things," I begin{harris_demands_component.cant_talk_right: helplessly}. "Things I didn't want to do. I tried not to. But in the end, it felt like cutting off my own arm to resist."


=== harris_demands_component ===

= cant_talk_right
    "I can't talk right" I said, incomprehensibly
`

exports[`test/conditionals.js TAP conditionals inline conditional > snap 1`] = `
before {true:yes please|no thank you} after
`

exports[`test/conditionals.js TAP conditionals multiline binary > snap 1`] = `
{true:
    you are tester
- else: hello production
    this is the game for real
}
`

exports[`test/conditionals.js TAP conditionals multiline unary > snap 1`] = `
{true:
    hello world
}
`

exports[`test/conditionals.js TAP conditionals newlines based on child structure > snap 1`] = `
VAR conditionA = true
VAR conditionB = true


=== Knot1 ===
    knot1

=== function test1
    {
        - conditionA: 
            ME:     Some dialogue.

        - conditionB: ~ return false
    }


=== test2 ===
    {
        - "a" == "b": -> Knot1
        - "a" == "d": 
            ~ test1()
            ~ test1()

    }

    ME: Some more.
`

exports[`test/conditionals.js TAP conditionals switch case > snap 1`] = `
{RANDOM(0, RANDOM(0, 69)):
    - 0: ~ return true
    - 42: ~ return "deep thought"
    - else: ~ return false
}
`
