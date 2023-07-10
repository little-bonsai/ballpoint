require("inkjs/compiler/Parser/InkParser");
require("inkjs/compiler/Parser/StatementLevel");
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
	t.test(name, async (t) => {
		const { data: first } = format(src, sourceFilename);

		t.matchSnapshot(first, "snap");
		if (log) {
			console.log("\n\n");
			console.log(first);
			console.log("\n\n");
		}

		if (!once) {
			const { data: second } = format(first, sourceFilename);
			t.equal(first, second, "re-compile");
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
					const firstJson = JSON.parse(
						new Compiler(src, compileOptions).Compile().ToJson()
					);
					try {
						const secondJson = JSON.parse(
							new Compiler(first, compileOptions)
								.Compile()
								.ToJson()
						);
						t.same(firstJson, secondJson);
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
	});
};
