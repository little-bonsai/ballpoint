const { pipe, getKind, logNode, tap, tapJSON } = require("./util");

exports.flattenPrintTree = pipe(
	(x) => x.flat(999),
	(x) => x.filter(Boolean),
	(x) =>
		x.reduce(
			function collapseLines({ head, lines }, node) {
				if (typeof node === "string") {
					return {
						head: head + node,
						lines,
					};
				} else {
					return {
						head: "",
						lines: [...lines, head, node],
					};
				}
			},
			{ head: "", lines: [] }
		),

	({ head, lines }) => [...lines, head],
	(x) => x.filter((node) => node !== "")
);

function rep(count, str) {
	return new Array(Math.max(0, count)).fill(str).join("");
}

function updateLatestStringLine(lines, fn) {
	let i = lines.length;
	while (i-- > 0) {
		if (typeof lines[i] === "string") {
			lines[i] = fn(lines[i]);
			break;
		}
	}
}

function getLatestStringLine(lines) {
	let i = lines.length;
	while (i-- > 0) {
		if (typeof lines[i] === "string") {
			return lines[i];
		}
	}
}

const applyLines = pipe(
	(lines) => ["", ...lines],

	function applyForcedLines(nodes) {
		const lines = [];
		for (const node of nodes) {
			if (node.kind === "Line" && node.force) {
				const latestLine = getLatestStringLine(lines);
				const linesToAdd =
					(node.lines ?? 1) -
					(latestLine.match(/\n+$/)?.[0]?.length ?? 0);
				updateLatestStringLine(
					lines,
					(line) => line + rep(linesToAdd, "\n")
				);
			} else {
				lines.push(node);
			}
		}

		return lines;
	},

	function applyUnForcedLines(nodes) {
		const lines = [];

		for (const node of nodes) {
			if (node.kind === "Line") {
				const latestLine = getLatestStringLine(lines);
				if (!latestLine.endsWith(rep(node.lines ?? 1, "\n"))) {
					const linesToAdd =
						(node.lines ?? 1) -
						(latestLine.match(/\n+$/)?.[0]?.length ?? 0);
					updateLatestStringLine(
						lines,
						(line) => line + rep(linesToAdd, "\n")
					);
				}
			} else {
				lines.push(node);
			}
		}

		return lines;
	}
);

const applyIndentDrivenLines = pipe(
	function addLineDirectives(nodes) {
		return nodes.reduce(
			function injectUnIndentLines({ lines, indent, flavour }, node) {
				if (node.kind === "Indent") {
					const newIndent = node.fn(indent);
					const newFlavour = node.flavour || flavour;

					const decreasedIndent = newIndent < indent;
					const increasedIndent = newIndent > indent;
					const retainedIndent = newIndent === indent;

					const intoGather = newFlavour === "Gather";
					const intoChoice = newFlavour === "Choice";
					const change =
						flavour && newFlavour && flavour !== newFlavour;

					const breakWorthy =
						decreasedIndent ||
						(increasedIndent && intoGather && change) ||
						(retainedIndent && intoGather && !change);

					const willBreak = node.mayBreak && breakWorthy;

					const linesNew = willBreak
						? [...lines, { kind: "Line", lines: 2 }, node]
						: [...lines, node];

					return {
						lines: linesNew,
						indent: newIndent,
						flavour: newFlavour,
					};
				} else {
					return { lines: [...lines, node], indent, flavour };
				}
			},
			{
				lines: [],
				indent: 0,
				flavour: null,
			}
		).lines;
	},

	applyLines
);

exports.applyDirectives = pipe(
	applyLines,

	(x) =>
		x.reduce(
			function collapseLineBreaks({ head, lines, acc }, node) {
				if (typeof node === "string") {
					if (node.includes("\n")) {
						return {
							head: "",
							lines: [...lines, head + node, ...acc],
							acc: [],
						};
					} else {
						return {
							head: head + node,
							lines,
							acc,
						};
					}
				}

				if (head === "") {
					return { head, lines: [...lines, node], acc: [] };
				} else {
					return { head, lines, acc: [...acc, node] };
				}
			},
			{ head: "", lines: [], acc: [] }
		),
	({ head, lines, acc }) => [...lines, head, ...acc],

	applyIndentDrivenLines,

	(x) =>
		x.reduce(
			function applyIndentation({ lines, indent, enabled }, node) {
				if (typeof node === "string") {
					return {
						indent,
						enabled,
						lines: [
							...lines,
							new Array(indent)
								.fill(enabled ? "    " : "")
								.join("") + node,
						],
					};
				}

				if (node.kind === "DisableIndent") {
					return { lines, indent, enabled: false };
				}

				if (node.kind === "EnableIndent") {
					return { lines, indent, enabled: true };
				}

				if (node.kind === "Indent") {
					return {
						lines,
						indent: Math.max(0, node.fn(indent)),
						enabled,
					};
				}

				return {
					indent,
					enabled,
					lines: [...lines, node],
				};
			},
			{ lines: [], indent: 0, enabled: true }
		),
	({ lines }) => lines
);
