/* IMPORTANT
 * This snapshot file is auto-generated, but designed for humans.
 * It should be checked into source control and tracked carefully.
 * Re-generate by setting TAP_SNAPSHOT=1 and running tests.
 * Make sure to inspect the output below.  Do not ignore changes!
 */
'use strict'
exports[`test/index.js TAP > basic 1`] = `

hello world
`

exports[`test/index.js TAP > comment 1`] = `

 //Character variables. We track just two, using a +/- scale
`

exports[`test/index.js TAP > declarations 1`] = `

VAR forceful = 0
CONST awesome = true
`

exports[`test/index.js TAP > inline conditional 1`] = `

{COND:yes please|no thank you}
`

exports[`test/index.js TAP > multiline conditiona 1`] = `

{DEBUG_MULTI:
    you are tester
 - else: hello production
  }
`

exports[`test/index.js TAP > nested knot 1`] = `

=== testStitch ===
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

exports[`test/index.js TAP > simple knot 1`] = `

=== indentTest1 ===
  * one
    one child
    * * two
        two child
      * * * three
            three child
  - -> DONE
`

exports[`test/index.js TAP > tagged 1`] = `
#foo bar 
`

exports[`test/index.js TAP > todo 1`] = `

TODO: some thing must be done
`
