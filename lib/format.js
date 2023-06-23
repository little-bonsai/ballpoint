const lineColumn = require("line-column");

let InkParser = null;

try {
	InkParser = require("inkjs/compiler/Parser/InkParser").InkParser;
} catch (e) {
	InkParser = require("../vendor/inkjs/compiler/Parser/InkParser").InkParser;
}

const { pipe, getKind, logNode, tap, tapJSON } = require("./util");
const { flattenPrintTree, applyDirectives } = require("./postProcess");
const { extractComments } = require("./preProcess");
const render = require("./render");

module.exports = function format(src, inputFilename) {
	const fileHandler = {
		ResolveInkFilename: (filename) => filename,
		LoadInkFileContents: (filename) =>
			`~ __littleBonsaiPrettierInternalDoNotTouch_INCLUDE = "${btoa(
				filename
			)}"`,
	};

	const parser = new InkParser(src, inputFilename, null, null, fileHandler);
	const ast = parser.StatementsAtLevel(3);

	const getNodeSourceIndex = (node) => {
		const lineColumnInstance = lineColumn(src);
		const line = node?._debugMetadata?.startLineNumber ?? -1;
		const col = node?._debugMetadata?.startCharacterNumber ?? -1;

		if (line + col > 0) {
			return lineColumnInstance.toIndex({ line, col });
		} else {
			return -1;
		}
	};

	const context = { comments: extractComments(src), getNodeSourceIndex };

	return pipe(
		(ast) => render(ast, context),
		flattenPrintTree,
		(x) => ["", ...x],
		applyDirectives,
		(x) => x.filter((node) => typeof node === "string"),
		(x) => x.join(""),
		(x) => x.replace(/^(\s*\n)*/g, ""),
		(x) => x.trimEnd()
	)(ast);
};
