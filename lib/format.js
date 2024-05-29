const lineColumn = require("line-column");
const InkParser = require("../vendor/compiler/Parser/InkParser").InkParser;

const { pipe, getKind, logNode, tap, tapJSON } = require("./util");
const { flattenPrintTree, applyDirectives } = require("./postProcess");
const { extractComments } = require("./preProcess");
const render = require("./render");

module.exports = function format(src, inputFilename = "web.ink", options = {}) {
	try {
		const fileHandler = {
			ResolveInkFilename: (filename) => filename,
			LoadInkFileContents: (filename) =>
				`~ __littleBonsaiPrettierInternalDoNotTouch_INCLUDE = "${btoa(
					filename,
				)}"`,
		};

		const parser = new InkParser(
			src,
			inputFilename,
			null,
			null,
			fileHandler,
		);
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

		const data = pipe(
			(ast) => render(ast, context),
			flattenPrintTree,
			(x) => ["", ...x],
			applyDirectives,
			(x) => x.filter((node) => typeof node === "string"),
			(x) => x.join(""),
			(x) => x.replace(/^(\s*\n)*/g, ""),
			(x) => x.trimEnd(),
		)(ast);

		return { data };
	} catch (error) {
		return { error };
	}
};
