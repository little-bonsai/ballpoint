const t = require("tap");

const { runTest } = require("./utils");

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
