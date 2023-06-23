require("inkjs/compiler/Parser/InkParser");
require("inkjs/compiler/parser/StatementLevel");
const { Compiler } = require("inkjs");

const format = require("../lib/format");

exports.runTest = function runTest(
	t,
	name,
	src,
	{
		once = false,
		filepath: sourceFilename = "test.ink",
		log = false,
		withCompile = true,
	} = {}
) {
	const first = format(src, sourceFilename);

	t.matchSnapshot(first, name);
	if (log) {
		console.log("\n\n");
		console.log(first);
		console.log("\n\n");
	}
	if (!once) {
		const second = format(first, sourceFilename);
		t.equal(first, second);
		if (withCompile) {
			let includeI = 0;
			const errors = [];
			const compileOptions = {
				errorHandler: (err) => errors.push(err),
				sourceFilename,
				fileHandler: {
					ResolveInkFilename: (filename) => filename,
					LoadInkFileContents: (filename) =>
						`CONST include_stub_${includeI} = ${includeI++}`,
				},
			};
			try {
				const firstJson = new Compiler(src, compileOptions)
					.Compile()
					.ToJson();
				try {
					const secondJson = new Compiler(first, compileOptions)
						.Compile()
						.ToJson();
					t.equal(firstJson, secondJson);
					return firstJson;
				} catch (e) {
					console.error(name, "Second Compile", e, errors);
					throw e;
				}
			} catch (e) {
				console.error(name, "First Compile", e, errors);
				throw e;
			}
		}
	}
};
