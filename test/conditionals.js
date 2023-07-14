const t = require("tap");

const { runTest } = require("./utils");

t.test("conditionals", (t) => {
	const test = runTest.bind(null, t);

	test("inline conditional", ` before {true:yes please|no thank you} after `);

	test(
		"multiline unary",
		`{true:
	hello world
	}`
	);

	test(
		"multiline binary",
		`{true:
	you are tester
	- else :hello production
	this is the game for real
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

	test(
		"condition based on nested path",
		`
	 "I've done things," I begin{harris_demands_component.cant_talk_right: helplessly}. "Things I didn't want to do. I tried not to. But in the end, it felt like cutting off my own arm to resist."

	 === harris_demands_component
	 = cant_talk_right
	 "I can't talk right" I said, incomprehensibly
	`
	);

	test(
		"newlines based on child structure",
		`

VAR conditionA = true
VAR conditionB = true
=== Knot1 ===
	knot1

=== function test1
		{
    - conditionA:
        ME:     Some dialogue.
		- conditionB:
		~return false
	}

	=== test2
	{
	- "a" == "b": -> Knot1
	- "a" == "d":
	~ test1()
	~ test1()
	}
	ME: Some more.
	`
	);

	test(
		"inline conditional Tunnel",
		`
		=== Tunnel
		tunnel 
		->->

{true : -> Tunnel -> }
`
	);
	t.end();
});
