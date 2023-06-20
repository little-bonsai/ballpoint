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

exports.applyDirectives = pipe(
	(x) =>
		x.reduce(function applyLineBreaks(lines, node) {
			if (node.kind === "LineBreak") {
				return [
					...lines,
					new Array(node.lines ?? 1).fill("\n").join(""),
				];
			}
			return [...lines, node];
		}, []),
	(x) =>
		x.reduce(function applyTrailingLines(lines, node, i, nodes) {
			if (node.kind === "TrailingLine") {
				if (
					typeof lines.at(-1) === "string" &&
					!lines.at(-1).endsWith("\n") &&
					!(
						typeof nodes[i + 1] === "string" &&
						(nodes[i + 1] ?? "").startsWith("\n")
					)
				) {
					return [
						...lines.slice(0, -1),
						lines.at(-1) +
							new Array(node.lines ?? 1).fill("\n").join(""),
					];
				}

				return lines;
			}

			return [...lines, node];
		}, []),

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
			function applyIndentation(
				{ lines, indent, enabled },
				node,
				i,
				nodes
			) {
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
					return { lines, indent: node.fn(indent), enabled };
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
