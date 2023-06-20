const t = require("tap");

const { runTest } = require("./utils");

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
