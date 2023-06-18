/* IMPORTANT
 * This snapshot file is auto-generated, but designed for humans.
 * It should be checked into source control and tracked carefully.
 * Re-generate by setting TAP_SNAPSHOT=1 and running tests.
 * Make sure to inspect the output below.  Do not ignore changes!
 */
'use strict'
exports[`test/index.js TAP basic > comment 1`] = `

some value
//Character variables. We track just two, using a +/- scale

and some value
`

exports[`test/index.js TAP basic > single line 1`] = `

hello world
`

exports[`test/index.js TAP basic > tagged 1`] = `

hello #foo bar
`

exports[`test/index.js TAP basic > tagged multiple 1`] = `

hello #foo #bar baz #qux
`

exports[`test/index.js TAP basic > todo 1`] = `

TODO: some thing must be done
`

exports[`test/index.js TAP choices > simple knot 1`] = `

=== indentTest1 ===
  * one
    one child
    * * two
        two child
      * * * three
            three child
  - -> DONE
`

exports[`test/index.js TAP conditionals > inline conditional 1`] = `

{COND:
    yes please|no thank you
    }
`

exports[`test/index.js TAP examples > function calls and diverts 1`] = `

`

exports[`test/index.js TAP functions > inline call 1`] = `

the time is now {RANDOM(1, RANDOM(1, 6))} o'clock
`

exports[`test/index.js TAP functions > outline call 1`] = `

hello
~ RANDOM(
1RANDOM(1, 6))
world
`

exports[`test/index.js TAP prettier ignore > prettier-ignore 1`] = `

`

exports[`test/index.js TAP prettier ignore > prettier-ignore stops 1`] = `

`

exports[`test/index.js TAP variables > declarations 1`] = `

VAR forceful = 0
CONST awesome = true
LIST colors = 
`
