const t = require("tap");

const { runTest } = require("./utils");

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
