/* IMPORTANT
 * This snapshot file is auto-generated, but designed for humans.
 * It should be checked into source control and tracked carefully.
 * Re-generate by setting TAP_SNAPSHOT=1 and running tests.
 * Make sure to inspect the output below.  Do not ignore changes!
 */
'use strict'
exports[`test/conditionals.js TAP conditionals > bare switch case divert 1`] = `
{
    - check == value1: -> OtherLovers_Selfish
    - check == value2: -> OtherLovers_Passive
    - check == value2: -> OtherLovers_Giving
}
`

exports[`test/conditionals.js TAP conditionals > bare switch case logic 1`] = `
{
    - answer == 0: ~ return true
    - answer == 42: ~ return "deep thought"
    - else: ~ return false
}
`

exports[`test/conditionals.js TAP conditionals > inline conditional 1`] = `
=== knot ===
//currently only works in knots
base
before {COND:yes please|no thank you} after
`

exports[`test/conditionals.js TAP conditionals > multiline conditiona 1`] = `
{DEBUG_MULTI:
    you are tester
    - else: hello production
}
`

exports[`test/conditionals.js TAP conditionals > switch case 1`] = `
{LIST_COUNT(LIST_INVERT(quest ^ Journal)):
    - 0: ~ return true
    - 42: ~ return "deep thought"
    - else: ~ return false
}
`
