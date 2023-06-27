/* IMPORTANT
 * This snapshot file is auto-generated, but designed for humans.
 * It should be checked into source control and tracked carefully.
 * Re-generate by setting TAP_SNAPSHOT=1 and running tests.
 * Make sure to inspect the output below.  Do not ignore changes!
 */
'use strict'
exports[`test/examples.js TAP examples 001 > snap 1`] = `
LIST l = CARSTAIRS_KNOWS_EARRING_YOURS, KNOW_MALC_IN_DEBT_CARSTAIRS
~ reached((CARSTAIRS_KNOWS_EARRING_YOURS, KNOW_MALC_IN_DEBT_CARSTAIRS))


=== function reached(x)
    ~ return false
`

exports[`test/examples.js TAP examples 002 > snap 1`] = `
{once:
    - Hi!
}
`

exports[`test/examples.js TAP examples 003 > snap 1`] = `
    * * V:  Have the other one too.
    - - response line
        response line 2
  - new topic line one
    new topic line two
`

exports[`test/examples.js TAP examples 004 > snap 1`] = `
=== knot ===
x
  - ->->
LIST walkarounddeck = WANNA_WALK_AROUND_DECK, DID_WALK_AROUND_DECK
`

exports[`test/examples.js TAP examples 005 > snap 1`] = `
CONST GOBLIN_SAY_LAND_IS_DONE_FOR = true
CONST ICEY = "it is icey"

=== function reached(x)
    ~ return true

=== knot ===
  * (donefor) {reached(GOBLIN_SAY_LAND_IS_DONE_FOR)} 
    [{ICEY} - "You said the land is done for." ] 
    MOIRA: You said the land is done for.
`

exports[`test/examples.js TAP examples 006 > snap 1`] = `
  * ->
    ICEY:   May your crampons never slip!
`
