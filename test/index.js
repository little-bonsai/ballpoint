const t = require("tap");
const prettier = require("prettier");

function parse(src, filepath = "main.ink") {
  return prettier.format(src, {
    parser: "ink",
    plugins: ["."],
  });
}

function runTest(t, name, src, { once = false, filepath, log = false } = {}) {
  const first = parse(src, filepath);
  t.matchSnapshot(first, name);
  if (log) {
    console.log("\n\n");
    console.log(first);
    console.log("\n\n");
  }
  if (!once) {
    const second = parse(first, filepath);
    t.equal(first, second);
  }
}

//t.only("specific", (t) => {
//const test = runTest.bind(null, t);

//t.end();
//});

t.test("suite", (t) => {
  const test = runTest.bind(null, t);
  test("basic", "hello world", "basic");
  test(
    "comment",
    ` some value
// Character variables. We track just two, using a +/- scale
and some value `
  );

  test("todo", ` TODO: some thing must be done `);
  test(
    "function call",
    `
	text 
	~ callFn(1, "a")
	more text`
  );
  test("tagged", "hello #foo bar");
  test("tagged multiple", "hello #foo #bar baz #qux", { log: true });

  test(
    "declarations",
    `VAR forceful = 0
CONST awesome = true
LIST colors = red, (green), blue`
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

  test("inline conditional", "{COND:yes please|no thank you}");
  test(
    "multiline conditiona",
    `{DEBUG_MULTI:
you are tester
- else :hello production
}`
  );

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
=== testStitch ===
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
    "prettier-ignore",
    `
   === knot
//prettier-ignore
****** some fucked up styling
-    { dsadwad     :    dwda |   dwadawdwa } some      other        line
~ var   =   true
`
  );

  test(
    "prettier-ignore stops",
    `
   === knot
//prettier-ignore
****** some fucked up styling

=== knot
*** this knot will be styled
`
  );
  t.end();
});

t.test("examples", (t) => {
  const test = runTest.bind(null, t);
  test(
    "function calls and diverts",
    `=== armoury_1 ===
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
