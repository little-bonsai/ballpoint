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

function sortStatements(lines) {
	function scoreLine(line) {
		if (line.trim().startsWith("INCLUDE")) {
			return 0;
		}
		if (line.trim().startsWith("CONST")) {
			return 1;
		}
		if (line.trim().startsWith("VAR")) {
			return 2;
		}

		return 3;
	}

	return [...lines]
		.map((line, i) => [i, line])
		.sort(([iL, lineL], [iR, lineR]) => {
			const scoreL = scoreLine(lineL);
			const scoreR = scoreLine(lineR);

			if (scoreL === scoreR) {
				return iL - iR;
			} else {
				return scoreL - scoreR;
			}
		})
		.map(([_, line]) => line)
		.map((line, i, lines) => {
			if (
				line.startsWith("CONST") &&
				!lines?.[i - 1]?.startsWith("CONST")
			) {
				return "\n" + line;
			}
			if (line.startsWith("VAR") && !lines?.[i - 1]?.startsWith("VAR")) {
				return "\n" + line;
			}

			return line;
		});
}

module.exports = function format(src, inputFilename = "web.ink", options = {}) {
	try {
		const fileHandler = {
			ResolveInkFilename: (filename) => filename,
			LoadInkFileContents: (filename) =>
				`~ __littleBonsaiPrettierInternalDoNotTouch_INCLUDE = "${btoa(
					filename
				)}"`,
		};

		const parser = new InkParser(
			src,
			inputFilename,
			null,
			null,
			fileHandler
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
			options.sortStatements ? sortStatements : (x) => x,
			(x) => x.join(""),
			(x) => x.replace(/^(\s*\n)*/g, ""),
			(x) => x.trimEnd()
		)(ast);

		return { data };
	} catch (error) {
		return { error };
	}
};
