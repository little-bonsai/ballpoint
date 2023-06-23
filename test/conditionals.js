const t = require("tap");

const { runTest } = require("./utils");

t.test("conditionals", (t) => {
	const test = runTest.bind(null, t);

	test("inline conditional", ` before {true:yes please|no thank you} after `);

	test(
		"multiline conditiona",
		`{true:
	you are tester
	- else :hello production
	}`
	);

	test(
		"switch case",
		`
	{ RANDOM(0, RANDOM(0, 69)):
	- 0: ~ return true
	- 42: ~ return "deep thought"
	- else: ~ return false
	} `
	);

	test(
		"bare switch case logic",
		`
	{
	- RANDOM(0,1) == 0: ~ return true
	- RANDOM(0,1) == 42: ~ return "deep thought"
	- else: ~ return false
	}
	`
	);

	test(
		"bare switch case divert",
		`
		=== Knot1
		hello one 
		=== Knot2
		hello two 
		=== Knot3
		hello three 
	{
	- "a" == "b": -> Knot1
	- "a" == "c": -> Knot2
	- "a" == "d": -> Knot3
	}
	`
	);

	t.end();
});
