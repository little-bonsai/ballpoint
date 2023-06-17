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

exports[`test/index.js TAP choices > conditional choice 1`] = `

=== knot ===

  * { isCool } I ride motorbikes
  * { not isCool } I hate motorbikes
  * { isCool } { ownsMotorbike } get on babe
`

exports[`test/index.js TAP choices > nested knot 1`] = `

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
  - gather sigmathis is your choice:
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
        piss off
        -> fightScene.rumble
        - - wow, alright, I'm super impressed
  * choice two
    wow, bold move
  * choice three
    what else?
  - gatherbut nowI will ask another question
  * yes, I say
  * no, I say -> DONE
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
{COND:yes please|no thank you}
`

exports[`test/index.js TAP conditionals > multiline conditiona 1`] = `

{DEBUG_MULTI:
  you are tester
  - else: hello production
  }
`

exports[`test/index.js TAP conditionals > switch case 1`] = `

{LIST_COUNT(LIST_INVERT(quest ^ Journal)):
  - 0: ~ return true
  - 42: ~ return "deep thought"
  - else: ~ return false
  }
`

exports[`test/index.js TAP examples > function calls and diverts 1`] = `

`

exports[`test/index.js TAP functions > inline call 1`] = `
the time is now {RANDOM(1RANDOM(16))} o'clock
`

exports[`test/index.js TAP functions > outline call 1`] = `
hello
~ RANDOM(1RANDOM(16))world
`

exports[`test/index.js TAP prettier ignore > prettier-ignore 1`] = `

=== knot ===

   //prettier-ignore
****** some fucked up styling
-    { dsadwad     :    dwda |   dwadawdwa } some      other        line
~ var   =   true
`

exports[`test/index.js TAP variables > declarations 1`] = `

VAR forceful = 0
CONST awesome = true
LIST colors = red, (green), blue
`

exports[`test/index.js TAP variables > variable modification 1`] = `

~ num++
~ num--
~ num = 2

~ num += 3
~ num -= 4

~ str = "hello"

~ str = "world"

`
