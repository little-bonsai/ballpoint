/* IMPORTANT
 * This snapshot file is auto-generated, but designed for humans.
 * It should be checked into source control and tracked carefully.
 * Re-generate by setting TAP_SNAPSHOT=1 and running tests.
 * Make sure to inspect the output below.  Do not ignore changes!
 */
'use strict'
exports[`test/conditionals.js TAP conditionals > bare switch case divert 1`] = `
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

exports[`test/conditionals.js TAP conditionals > bare switch case logic 1`] = `
{
    - RANDOM(0, 1) == 0: ~ return true
    - RANDOM(0, 1) == 42: ~ return "deep thought"
    - else: ~ return false
}
`

exports[`test/conditionals.js TAP conditionals > inline conditional 1`] = `
before {true:yes please|no thank you} after
`

exports[`test/conditionals.js TAP conditionals > multiline conditiona 1`] = `
{true:
    you are tester
    - else: hello production
}
`

exports[`test/conditionals.js TAP conditionals > switch case 1`] = `
{RANDOM(0, RANDOM(0, 69)):
    - 0: ~ return true
    - 42: ~ return "deep thought"
    - else: ~ return false
}
`
