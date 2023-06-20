const t = require("tap");

require("inkjs/compiler/Parser/InkParser");
require("inkjs/compiler/parser/StatementLevel");

const format = require("../lib/format");

function runTest(t, name, src, { once = false, filepath, log = false } = {}) {
	const first = format(src, filepath);
	t.matchSnapshot(first, name);
	if (log) {
		console.log("\n\n");
		console.log(first);
		console.log("\n\n");
	}
	if (!once) {
		const second = format(first, filepath);
		t.equal(first, second);
	}
}

t.test("basic", (t) => {
	const test = runTest.bind(null, t);

	test("single line", "hello world", "basic");
	test(
		"comment",
		` /**
* Welcome to the intercept
*/
first line
// Character variables. We track just two, using a +/- scale
second line `
	);

	test("todo", ` TODO: some thing must be done `);
	test("tagged", "hello #foo bar");
	test("tagged multiple", "hello #foo #bar baz #qux");
	test(
		"includes",
		`
INCLUDE ./foo.ink
INCLUDE ./bar/baz.ink
INCLUDE ./qux.ink

VAR isFormatted = falsedwad`
	);

	t.end();
});

t.test("sequences", (t) => {
	const test = runTest.bind(null, t);

	test(
		"sequences",
		`
{|foo|bar|}
{&|foo|bar|}
{~|foo|bar|}
{!|foo|bar|}
	`
	);

	t.end();
});

t.test("functions", (t) => {
	const test = runTest.bind(null, t);

	test("inline call", ` the time is now { RANDOM(1,RANDOM(1,6)) } o'clock `);

	test(
		"outline call",
		`hello
~ RANDOM(1,RANDOM(1,6))
world`
	);

	test(
		"function",
		`
=== function alter(ref x, k) ===
~ temp altered = x + k
~ x = altered
~ return x
`
	);

	test(
		"externals",
		`
EXTERNAL functionName(a,b,c)
`
	);

	t.end();
});

t.test("conditionals", (t) => {
	const test = runTest.bind(null, t);

	test(
		"inline conditional",
		`===knot
	  //currently only works in knots
	  base
	before {COND:yes please|no thank you} after `
	);
	test(
		"multiline conditiona",
		`{DEBUG_MULTI:
you are tester
- else :hello production
}`
	);

	test(
		"switch case",
		`
  { LIST_COUNT(LIST_INVERT(quest ^ Journal)):
    - 0: ~ return true
    - 42: ~ return "deep thought"
    - else: ~ return false
  } `
	);
	test(
		"bare switch case logic",
		`
  { 
    - answer == 0: ~ return true
    - answer == 42: ~ return "deep thought"
    - else: ~ return false
  }

`
	);

	test(
		"bare switch case divert",
		`
{
- check == value1: -> OtherLovers_Selfish
- check == value2: -> OtherLovers_Passive
- check == value2: -> OtherLovers_Giving
}
`
	);

	t.end();
});

t.test("variables", (t) => {
	const test = runTest.bind(null, t);

	test(
		"declarations",
		`
	  VAR forceful = 0
CONST awesome = true
LIST colors = red, (green), blue
VAR emptyList = ()
`
	);

	test(
		"variable modification",
		`
~ num++
~ num--
~ num = 2
~ num += 3
~ num -= 4

~ str = "hello"
~ str = "world"
`
	);

	t.end();
});

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

t.test("examples", (t) => {
	const test = runTest.bind(null, t);
	test(
		"function calls and diverts",
		`
	  === armoury_1 ===
* George: Hello, fellow Hentai Heads -> map_2
* Jerry: George! You got in to Spooky High too?
Kramer: Dang, George has used up all the hentai here, we'll have to look elsewhere!
~ RANDOM(1,2)
~ RANDOM(1,2)
-> map_1
`
	);
	t.end();
});
