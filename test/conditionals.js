const t = require("tap");

const { runTest } = require("./utils");

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
