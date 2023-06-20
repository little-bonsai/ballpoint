/* IMPORTANT
 * This snapshot file is auto-generated, but designed for humans.
 * It should be checked into source control and tracked carefully.
 * Re-generate by setting TAP_SNAPSHOT=1 and running tests.
 * Make sure to inspect the output below.  Do not ignore changes!
 */
'use strict'
exports[`test/weave.js TAP knots & weave > Glue 1`] = `
this line <>
and this line
`

exports[`test/weave.js TAP knots & weave > Tunnel Onwards 1`] = `
something ->->
`

exports[`test/weave.js TAP knots & weave > conditional choice 1`] = `
=== knot ===
  * {isCool} I ride motorbikes
  * {not isCool} I hate motorbikes
  * { isCool } { ownsMotorbike } get on babe
`

exports[`test/weave.js TAP knots & weave > divert target 1`] = `
* (dobed) [The bed...]
    * * {TURNS_SINCE(-> dobed) > 1} [Something else?]
`

exports[`test/weave.js TAP knots & weave > nested knot 1`] = `
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
`

exports[`test/weave.js TAP knots & weave > simple knot 1`] = `
=== indentTest1 ===
  * one
    one child
    * * two
        two child
      * * * three
            three child
  - -> DONE
`

exports[`test/weave.js TAP knots & weave > tunnels 1`] = `
=== murder_scene ===
The bedroom. This is where it happened. Now to look for clues.
  - (top) {bedroomLightState ? seen:  <- seen_light}
 <- compare_prints
`
