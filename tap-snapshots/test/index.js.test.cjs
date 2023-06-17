/* IMPORTANT
 * This snapshot file is auto-generated, but designed for humans.
 * It should be checked into source control and tracked carefully.
 * Re-generate by setting TAP_SNAPSHOT=1 and running tests.
 * Make sure to inspect the output below.  Do not ignore changes!
 */
'use strict'
exports[`test/index.js TAP suite > basic 1`] = `

hello world
`

exports[`test/index.js TAP suite > comment 1`] = `

some value
//Character variables. We track just two, using a +/- scale
and some value
`

exports[`test/index.js TAP suite > conditional choice 1`] = `

=== knot ===
  * { isCool } I ride motorbikes
  * { not isCool } I hate motorbikes
`

exports[`test/index.js TAP suite > declarations 1`] = `

VAR forceful = 0
CONST awesome = true
LIST colors = red, (green), blue
`

exports[`test/index.js TAP suite > function call 1`] = `

~ callFn(1, "a")

`

exports[`test/index.js TAP suite > inline conditional 1`] = `

{COND:yes please|no thank you}
`

exports[`test/index.js TAP suite > multiline conditiona 1`] = `

{DEBUG_MULTI:
    you are tester
 - else: hello production
  }
`

exports[`test/index.js TAP suite > nested knot 1`] = `

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

exports[`test/index.js TAP suite > prettier-ignore 1`] = `

=== knot ===
   //prettier-ignore
****** some fucked up styling
-    { dsadwad     :    dwda |   dwadawdwa } some      other        line
~ var   =   true
`

exports[`test/index.js TAP suite > prettier-ignore stops 1`] = `

=== knot ===
   //prettier-ignore
****** some fucked up styling


=== knot ===
      * * * this knot will be styled
`

exports[`test/index.js TAP suite > simple knot 1`] = `

=== indentTest1 ===
  * one
    one child
    * * two
        two child
      * * * three
            three child
  - -> DONE
`

exports[`test/index.js TAP suite > tagged 1`] = `

hello #foo bar
`

exports[`test/index.js TAP suite > tagged multiple 1`] = `

hello #foo #bar baz #qux
`

exports[`test/index.js TAP suite > todo 1`] = `

TODO: some thing must be done
`

exports[`test/index.js TAP suite > variable modification 1`] = `

~ num++
~ num--
~ num = 2
~ num += 3
~ num -= 4

~ str = "hello"
~ str = "world"
`
