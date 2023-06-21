const t = require("tap");

const { runTest } = require("./utils");

t.test("basic", (t) => {
	const test = runTest.bind(null, t);

	test("tagged", "hello #foo bar");
	test("tagged multiple", "hello #foo #bar baz #qux");
	test("dynamic tag", "hello #some_{x:RANDOM(y,z) | a}_{|foo|bar|bar}.jpg");

	t.end();
});
