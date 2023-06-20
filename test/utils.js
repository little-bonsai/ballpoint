require("inkjs/compiler/Parser/InkParser");
require("inkjs/compiler/parser/StatementLevel");

const format = require("../lib/format");

exports.runTest = function runTest(
	t,
	name,
	src,
	{ once = false, filepath, log = false } = {}
) {
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
};
