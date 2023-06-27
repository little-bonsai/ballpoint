/* IMPORTANT
 * This snapshot file is auto-generated, but designed for humans.
 * It should be checked into source control and tracked carefully.
 * Re-generate by setting TAP_SNAPSHOT=1 and running tests.
 * Make sure to inspect the output below.  Do not ignore changes!
 */
'use strict'
exports[`test/functions.js TAP functions externals > snap 1`] = `
EXTERNAL functionName(a, b, c)
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

exports[`test/functions.js TAP functions outline call > snap 1`] = `
hello
~ RANDOM(1, RANDOM(1, 6))
world
`
