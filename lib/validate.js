require("../vendor/compiler/Parser/StatementLevel");
const InkParser = require("../vendor/compiler/Parser/InkParser").InkParser;
const { Compiler } = require("../vendor");
const deepEqual = require("deep-equal");
const { diff } = require("jest-diff");

function flatten(node) {
	if (Array.isArray(node)) {
		return node.map(flatten);
	}

	if (typeof node !== "object") {
		return node;
	}

	if (!node) {
		return node;
	}

	const acc = {};
	for (const [key, val] of Object.entries(node)) {
		if (new Set(["boolean", "string", "number"]).has(typeof val)) {
			acc[key] = val;
		}

		if (key === "contents") {
			acc[key] = flatten(val);
		}
	}
	return acc;
}

function parse(src, sourceFilename) {
	const fileHandler = {
		ResolveInkFilename: (filename) => filename,
		LoadInkFileContents: (filename) =>
			`~ __littleBonsaiPrettierInternalDoNotTouch_INCLUDE = "${btoa(
				filename,
			)}"`,
	};
	const parser = new InkParser(src, sourceFilename, null, null, fileHandler);
	return parser.StatementsAtLevel(3);
}

function compile(src, sourceFilename) {
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
		return JSON.parse(new Compiler(src, compileOptions).Compile().ToJson());
	} catch (error) {
		throw error.message + "\n\n" + errors.join("\n");
	}
}

function validate(before, after, fileName) {
	const beforeParse = flatten(parse(before, fileName + ".before"));
	const afterParse = flatten(parse(after, fileName + ".after"));

	if (!deepEqual(beforeParse, afterParse)) {
		return (
			"Input does not parse the same as output" +
			"\n\n" +
			diff(afterParse, beforeParse, { expand: false })
		);
	}

	const beforeCompile = compile(before, fileName + ".before");
	const afterCompile = compile(after, fileName + ".after");

	if (!deepEqual(beforeCompile, afterCompile)) {
		return (
			"Input does not compile the same as output" +
			"\n\n" +
			diff(afterCompile, beforeCompile, { expand: false })
		);
	}

	return null;
}

module.exports = function validateWrapped(...args) {
	try {
		return validate(...args);
	} catch (e) {
		return e;
	}
};
