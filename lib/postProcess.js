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

exports.applyDirectives = pipe(
	(nodes) => {
		//apply LineBreak
		const lines = [];
		for (const node of nodes) {
			if (node.kind === "LineBreak") {
				updateLatestStringLine(
					lines,
					(line) =>
						line + new Array(node.lines ?? 1).fill("\n").join("")
				);
			} else {
				lines.push(node);
			}
		}

		return lines;
	},
	(nodes) => {
		//apply TrailingLine
		const lines = [];

		for (const node of nodes) {
			if (node.kind === "TrailingLine") {
				const latestLine = getLatestStringLine(lines);
				if (!latestLine.endsWith("\n")) {
					updateLatestStringLine(
						lines,
						(line) =>
							line +
							new Array(node.lines ?? 1).fill("\n").join("")
					);
				}
			} else {
				lines.push(node);
			}
		}

		return lines;
	},

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
