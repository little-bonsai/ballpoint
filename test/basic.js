const t = require("tap");

const { runTest } = require("./utils");

t.test("basic", (t) => {
	const test = runTest.bind(null, t);

	test("single line", "hello world");

	test(
		"comment",
		` /**
	* Welcome to the intercept
	*/
	first line
	// Character variables. We track just two, using a +/- scale
	second line `
	);

	test(
		"todo",
		`
	TODO: some thing must be done
	`
	);
	test(
		"includes",
		`
	INCLUDE ./foo.ink
	INCLUDE ./bar/baz.ink
	INCLUDE ./qux.ink

	VAR isFormatted = false`
	);

	t.end();
});
