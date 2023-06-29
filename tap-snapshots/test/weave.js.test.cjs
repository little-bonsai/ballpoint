/* IMPORTANT
 * This snapshot file is auto-generated, but designed for humans.
 * It should be checked into source control and tracked carefully.
 * Re-generate by setting TAP_SNAPSHOT=1 and running tests.
 * Make sure to inspect the output below.  Do not ignore changes!
 */
'use strict'
exports[`test/weave.js TAP knots & weave Glue > snap 1`] = `
this line <>
and this line
`

exports[`test/weave.js TAP knots & weave Tunnel Onwards > snap 1`] = `
something ->->
`

exports[`test/weave.js TAP knots & weave blank gather > snap 1`] = `
=== murder_scene ===
    - - (bedhub) 
    * * [Lift the bedcover]
        I lifted back the bedcover. The duvet underneath was crumpled.
`

exports[`test/weave.js TAP knots & weave conditional choice > snap 1`] = `
VAR isCool = true
VAR ownsMotorbike = true

=== knot ===
  * {isCool} I ride motorbikes
  * {not isCool} I hate motorbikes
  * { isCool } 
    { ownsMotorbike } 
    get on babe
  * { not isCool } 
    { ownsMotorbike } 
    -> paradox.motorbikeImposibility


=== paradox ===
= motorbikeImposibility
but that's ... not possible
`

exports[`test/weave.js TAP knots & weave divert target > snap 1`] = `
  * (dobed) [The bed...]
    * * {TURNS_SINCE(-> dobed) > 1} [Something else?]
`

exports[`test/weave.js TAP knots & weave labled conditional choice > snap 1`] = `
VAR isCool = true
VAR ownsMotorbike = true

=== knot ===
  * (label1) {isCool} 
    I ride motorbikes
  * (label2) { isCool } 
    { ownsMotorbike } 
    get on babe
  * (label3) { not isCool } 
    { ownsMotorbike } 
    -> paradox.motorbikeImposibility


=== paradox ===
= motorbikeImposibility
but that's ... not possible
`

exports[`test/weave.js TAP knots & weave nested knot > snap 1`] = `
=== previousKnot ===
test


=== Knot ===
hello world
  * out
  * one
    * * one point one
      * * * one point one point one
            sub ooo
      * * * one point one point two
            sub oot
      - - - (alpha) gather alpha
    * * one point two
    - - gather beta
  * two
  * three
  * four
  * five
  - gather sigma

= stitch
this is your choice:
  * choice one [ if you ] dare
    but will you?
    TODO: flesh out this choice
    * * yes
        wow, look at mr cool guy
        many
        lines
        go
        here
    + + (dangerousChoice) no
        piss off -> fightScene.rumble
    - - wow, alright, I'm super impressed
  * choice two
    wow, bold move
  * choice three
    what else?
  - gather
    but now
    I will ask another question
  * yes, I say
  * no, I say -> DONE


=== fightScene ===
= rumble
let's fight
`

exports[`test/weave.js TAP knots & weave simple knot > snap 1`] = `
=== indentTest1 ===
  * one
    one child
    * * two
        two child
      * * * three
            three child
  - -> DONE
`

exports[`test/weave.js TAP knots & weave specified tunnels > snap 1`] = `
=== window_opts ===
Through the steamed glass I couldn't see the brook. -> see_prints_on_glass -> window_opts


=== see_prints_on_glass ===
see prints on glass
->->
`

exports[`test/weave.js TAP knots & weave stitch function > snap 1`] = `
= compare_prints(-> backto)
foo
`

exports[`test/weave.js TAP knots & weave threads > snap 1`] = `
=== murder_scene ===
The bedroom. This is where it happened. Now to look for clues.
  - (top) {true: <- seen_light}
    <- compare_prints(-> top)
  - -> DONE

=== seen_light ===
seen light -> DONE


=== compare_prints(-> div) ===
compare_prints -> DONE
`

exports[`test/weave.js TAP knots & weave unspecified tunnels > snap 1`] = `
=== window_opts ===
Through the steamed glass I couldn't see the brook. -> see_prints_on_glass -> 


=== see_prints_on_glass ===
see prints on glass
->->
`
