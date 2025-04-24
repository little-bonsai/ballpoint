/* IMPORTANT
 * This snapshot file is auto-generated, but designed for humans.
 * It should be checked into source control and tracked carefully.
 * Re-generate by setting TAP_SNAPSHOT=1 and running tests.
 * Make sure to inspect the output below.  Do not ignore changes!
 */
'use strict'
exports[`test/functions.js TAP functions 0-arity function > snap 1`] = `
EXTERNAL cutSceneAdvance()
~ cutSceneAdvance()
before{cutSceneAdvance()} after
`

exports[`test/functions.js TAP functions calling with list > snap 1`] = `
LIST Supporters = on_desk, on_floor, on_bed, under_bed, held, with_joe

=== function move_to_supporter(ref item_state, new_supporter)
    ~ item_state -= LIST_ALL(Supporters)
    ~ item_state += new_supporter
`

exports[`test/functions.js TAP functions externals > snap 1`] = `
EXTERNAL functionName(a, b, c)
`

exports[`test/functions.js TAP functions externals with fallback > snap 1`] = `
EXTERNAL functionName(a, b, c)
=== function functionName(a, b, c)
    ~ return (a + b) + c
`

exports[`test/functions.js TAP functions function > snap 1`] = `
=== function alter(ref x, k)
    ~ temp altered = x + k
    ~ x = altered
    ~ return x
`

exports[`test/functions.js TAP functions inline call > snap 1`] = `
the time is now {RANDOM(1, RANDOM(1, 6))} o'clock
`

exports[`test/functions.js TAP functions many externals and functions > snap 1`] = `
EXTERNAL foo()
EXTERNAL bar(a, b, c)
=== function bar(a, b, c)
    ~ return (a + b) + c

=== function baz(a, b, c)
    ~ return (a + b) + c
EXTERNAL qux(a, b, c)
`

exports[`test/functions.js TAP functions outline call > snap 1`] = `
hello
~ RANDOM(1, RANDOM(1, 6))
world
`
