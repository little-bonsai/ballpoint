/* IMPORTANT
 * This snapshot file is auto-generated, but designed for humans.
 * It should be checked into source control and tracked carefully.
 * Re-generate by setting TAP_SNAPSHOT=1 and running tests.
 * Make sure to inspect the output below.  Do not ignore changes!
 */
'use strict'
exports[`test/variables.js TAP variables > declarations 1`] = `
VAR forceful = 0
CONST awesome = true
LIST colors = red, (green), blue
VAR emptyList = ()
`

exports[`test/variables.js TAP variables > variable modification 1`] = `
VAR num = 0
VAR str = ""
~ num++
~ num--
~ num = 2
~ num += 3
~ num -= 4
~ str = "hello"
~ str = "world"
`
