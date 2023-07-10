/* IMPORTANT
 * This snapshot file is auto-generated, but designed for humans.
 * It should be checked into source control and tracked carefully.
 * Re-generate by setting TAP_SNAPSHOT=1 and running tests.
 * Make sure to inspect the output below.  Do not ignore changes!
 */
'use strict'
exports[`test/index.js TAP examples eg2 > snap 1`] = `
=== function reach(statesToSet)
    ~ temp x = pop(statesToSet)
    {
        - not x: ~ return false
        - not reached(x): 
            ~ temp chain = LIST_ALL(x)
            ~ temp statesGained = LIST_RANGE(chain, LIST_MIN(chain), x)
            ~ reach(statesToSet)
            ~ return true
    - else: 
        ~ return false || reach(statesToSet)
    }

=== function reached(x)
    ~ return false

=== function pop(ref list)
    ~ return false
`

exports[`test/index.js TAP examples function calls and diverts > snap 1`] = `
=== armoury_1 ===
  * George: Hello, fellow Hentai Heads -> map_1
  * Jerry: George! You got in to Spooky High too?
    Kramer: Dang, George has used up all the hentai here, we'll have to look elsewhere!
    ~ RANDOM(1, 2)
    ~ RANDOM(1, 2)
    -> map_1


=== map_1 ===
    map
`
