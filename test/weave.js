const t = require("tap");

const { runTest } = require("./utils");

t.test("knots & weave", (t) => {
	const test = runTest.bind(null, t);

	test(
		"simple knot",
		`
=== indentTest1 ===
* one
one child
** two
two child
*** three
three child
- -> DONE
`
	);

	test(
		"nested knot",
		`
	  ===previousKnot
	  test
=== Knot ===
hello world
* out
* one
* * one point one
*** one point one point one
sub ooo
*** one point one point two
sub oot
--- (alpha) gather alpha
* * one point two
-- gather beta
* two
* three
* four
* five
- gather sigma
=stitch
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
piss off ->          fightScene.rumble
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
	);

	test(
		"conditional choice",
		`
=== knot ===
* { isCool } I ride motorbikes
* { not isCool } I hate motorbikes
* { isCool } { ownsMotorbike } get on babe
`
	);

	test(
		"Tunnel Onwards",
		`
something ->->

`
	);

	test(
		"Glue",
		`
this line <>
and this line

`
	);

	test(
		"divert target",
		`
*   (dobed) [The bed...]
* *     {TURNS_SINCE(-> dobed) > 1} [Something else?]
 `
	);

	test(
		"tunnels",
		`
		=== murder_scene ===
    The bedroom. This is where it happened. Now to look for clues.
- (top)
    { bedroomLightState ? seen:     <- seen_light  }
    <- compare_prints(-> top)
`
	);

	t.end();
});
