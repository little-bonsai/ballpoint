const {
	getLinesInRendered,
	pipe,
	getKind,
	logNode,
	tap,
	tapJSON,
} = require("./util");
function join(sep, xs) {
	const acc = [];
	let i = 0;
	while (i < xs.length) {
		acc.push(xs[i++]);
		if (i !== xs.length) {
			acc.push(sep);
		}
	}
	return acc;
}

function printIsolatedExpression(exp, retainIndentation = false) {
	return [
		retainIndentation ? [] : { kind: "DisableIndent" },
		{ kind: "Line", force: false },
		exp,
		{ kind: "Line", force: false },
		retainIndentation ? [] : { kind: "EnableIndent" },
	];
}

function wrapSubExpression(print, node) {
	return getKind(node).includes("Expression")
		? ["(", print(node), ")"]
		: print(node);
}

function getSibling(node, delta) {
	const myIndex = node?.parent?.content?.findIndex((x) => x === node) ?? 0;
	return node?.parent?.content?.[myIndex + delta];
}

exports.Null = function Null() {
	return;
};

exports.AuthorWarning = function AuthorWarning({ node }) {
	return ["TODO: ", node.warningMessage, { kind: "Line", force: false }];
};

exports.Array = function Array({ node, print }) {
	return node.map((child, _, content) => {
		child.parent ||= { content };
		return print(child);
	});
};

function ConditionalInline({ node, print, context }) {
	const branchStyle = "Inline";

	return [
		"{",
		print(node.initialCondition, { ...context, branchStyle }),
		":",
		join("|", print(node.branches, { ...context, branchStyle })),
		"}",
	];
}

function ConditionalInlineBranch({ node, print, context }) {
	return print(node.content, { ...context, isInline: true });
}

function ConditionalMultiLineUnary({ node, print, context }) {
	const branchStyle = "MultiLineUnary";

	return [
		"{",
		print(node.initialCondition, { ...context, branchStyle }),
		":",
		{ kind: "Line", force: true },
		{ kind: "Indent", fn: (x) => x + 2 },
		print(node.branches[0], { ...context, branchStyle }),
		{ kind: "Line", force: false },

		{ kind: "Indent", fn: (x) => x - 2 },
		"}",
	];
}

function ConditionalMultiLineUnaryBranch({ node, print, context }) {
	return print(node.content, { ...context, isInline: false });
}

function ConditionalMultiLineBinary({ node, print, context }) {
	const branchStyle = "MultiLineBinary";

	return [
		"{",
		print(node.initialCondition, { ...context, branchStyle }),
		":",
		{ kind: "Line", force: true },
		{ kind: "Indent", fn: (x) => x + 2 },
		print(node.branches[0], { ...context, branchStyle }),
		{ kind: "Line", force: false },

		{ kind: "Indent", fn: (x) => x - 2 },
		"- else: ",
		{ kind: "Indent", fn: (x) => x + 2 },
		print(node.branches[1], { ...context, branchStyle }),
		{ kind: "Line", force: false },
		{ kind: "Indent", fn: (x) => x - 2 },

		"}",
	];
}

function ConditionalMultiLineBinaryBranch({ node, print, context }) {
	return print(node.content, { ...context, isInline: false });
}

function ConditionalSwitchCase({ node, print, context }) {
	const out = [];
	const branchStyle = "SwitchCase";

	out.push("{");

	if (node.initialCondition) {
		out.push(print(node.initialCondition, { ...context, branchStyle }));
		out.push(":");
	}

	out.push({ kind: "Line", force: true });
	out.push({ kind: "Indent", fn: (x) => x + 2 });
	out.push(
		print(node.branches, { ...context, branchStyle }).map((x) => [
			x,
			{ kind: "Line", force: false },
		]),
	);
	out.push({ kind: "Indent", fn: (x) => x - 2 });

	out.push("}");
	out.push({ kind: "Line", force: false, lines: 2 });

	return out;
}

function ConditionalSwitchCaseBranch({ node, print, context }) {
	const out = [];

	if (node.isElse) {
		out.push("- else: ");
	} else {
		out.push("- ");
		out.push(print(node.content[1]));
		out.push(": ");
	}

	const hasMultiLineChild = node.content[0]?.content?.length !== 1;

	if (hasMultiLineChild) {
		out.push({ kind: "Line", force: false });
		out.push({ kind: "Indent", fn: (x) => x + 2 });
	}

	out.push(print(node.content[0]));

	if (hasMultiLineChild) {
		out.push({ kind: "Line", force: false, lines: 2 });
		out.push({ kind: "Indent", fn: (x) => x - 2 });
	}

	return out;
}

exports.Conditional = function Conditional({ node, print, context }) {
	const isInline = node.content.some((child) => child.isInline);

	if (isInline) {
		return ConditionalInline({
			node,
			print,
			context,
		});
	}

	if (node.initialCondition && node.branches[0]?.isTrueBranch) {
		if (node.branches.length === 1) {
			return ConditionalMultiLineUnary({ node, print, context });
		}
		if (node.branches.length === 2) {
			return ConditionalMultiLineBinary({ node, print, context });
		}

		throw new Error("Unknown Conditional Structure");
	}

	return ConditionalSwitchCase({ node, print, context });
};

exports.ConditionalSingleBranch = function ConditionalSingleBranch({
	node,
	print,
	context,
}) {
	if (context.branchStyle === "Inline") {
		return ConditionalInlineBranch({ node, print, context });
	} else if (context.branchStyle === "MultiLineUnary") {
		return ConditionalMultiLineUnaryBranch({ node, print, context });
	} else if (context.branchStyle === "MultiLineBinary") {
		return ConditionalMultiLineBinaryBranch({ node, print, context });
	} else if (context.branchStyle === "SwitchCase") {
		return ConditionalSwitchCaseBranch({ node, print, context });
	}

	return [];
};

exports.ref = function ref({ node, print }) {
	if (node.outputWhenComplete) {
		return ["{", print(node.pathIdentifiers), "}"];
	} else {
		return join(".", print(node.pathIdentifiers));
	}
};

exports.ContentList = function ContentList({ node, print, context }) {
	return print(node.content, context);
};

exports.FunctionCall = function FunctionCall({ node, print, context }) {
	const out = [];
	const isTopLevel = node.outputWhenComplete || node.shouldPopReturnedValue;

	if (isTopLevel) {
		const isInline = node.outputWhenComplete;
		if (isInline) {
			out.push("{");
			out.push(print(node.content, { ...context, isInline }));
			out.push("}");
		} else {
			out.push({ kind: "Line" });
			out.push("~ ");
			out.push(print(node.content, { ...context, isInline }));
		}
	} else {
		out.push(print(node.content, context));
	}

	return out;
};

exports.Text = function Text({ node, print }) {
	if (node.text === "\n") {
		return { kind: "Line", force: true };
	} else {
		return node.text;
	}
};

exports.Tag = function Tag({ node, print }) {
	if (node.isStart) {
		return "#";
	}
	return;
};

exports.MultipleConditionExpression = function MultipleConditionExpression({
	node,
	print,
}) {
	const out = [];
	for (const child of print(node.content)) {
		out.push("{ ");
		out.push(child);
		out.push(" } ");
		out.push({ kind: "Line", force: false });
	}

	return out;
};

exports.Choice = function Choice({ node, print, context }) {
	const out = [{ kind: "Line", force: false }];
	const hasSquareBrackets =
		node.choiceOnlyContent ||
		(getKind(node.innerContent?.content?.[0]) === "Text" &&
			node.innerContent?.content?.[0].text !== "\n");

	out.push({
		kind: "Indent",
		fn: (_) => node.indentationDepth * 2,
		mayBreak: true,
		flavour: "Choice",
	});
	out.push({ kind: "DisableIndent" });
	out.push(new Array(node.indentationDepth).fill("  ").join(""));
	out.push(
		new Array(node.indentationDepth)
			.fill(node.onceOnly ? "* " : "+ ")
			.join(""),
	);

	if (node.identifier) {
		out.push("(");
		out.push(print(node.identifier));
		out.push(") ");
	}

	if (node._condition) {
		if (getKind(node._condition) === "MultipleConditionExpression") {
			out.push({ kind: "EnableIndent" });
			out.push(print(node._condition));
		} else {
			const conditionPrinted = print(node._condition);
			const conditionLength = [conditionPrinted]
				.flat(Infinity)
				.join("").length;

			out.push("{");
			out.push(conditionPrinted);
			out.push("} ");
			if (conditionLength > 40) {
				out.push({ kind: "EnableIndent" });
				out.push({ kind: "Line", force: false });
			}
		}

		if (node.identifier) {
			out.push({ kind: "EnableIndent" });
			out.push({ kind: "Line", force: false });
		}
	}

	if (
		node.isInvisibleDefault &&
		node.innerContent?.content?.[0].text === "\n"
	) {
		out.push("->");
	}

	out.push(print(node.startContent, context));

	if (hasSquareBrackets) {
		out.push("[");
		out.push(print(node.choiceOnlyContent));
		out.push("]");
	}

	out.push(print(node.innerContent));

	out.push({ kind: "Line", force: false });
	out.push({ kind: "EnableIndent" });

	return out;
};

exports.Gather = function Gather({ node, print }) {
	const out = [];

	out.push({ kind: "Line", lines: 1 });
	out.push({
		kind: "Indent",
		fn: (_) => node.indentationDepth * 2,
		mayBreak: true,
		flavour: "Gather",
	});

	out.push({ kind: "DisableIndent" });
	out.push(new Array(node.indentationDepth).fill("  ").join(""));
	out.push(new Array(node.indentationDepth).fill("- ").join(""));

	if (node.identifier) {
		out.push("(");
		out.push(print(node.identifier));
		out.push(") ");
		out.push({ kind: "Line", lines: 1 });
	}

	out.push({ kind: "EnableIndent" });

	return out;
};

exports.Knot = function Knot({ node, print }) {
	const out = [];
	out.push({
		kind: "Line",
		force: true,
		lines: 3,
	});
	out.push({ kind: "Indent", fn: (_) => 0 });
	out.push("=== ");
	out.push(print(node.identifier));

	if (node.args?.length > 0) {
		out.push("(");
		out.push(join(", ", print(node.args)));
		out.push(")");
	}

	out.push(" ===");
	out.push({ kind: "Line", force: false });

	out.push({ kind: "Indent", fn: (_) => 2 });
	out.push(print(node.content));
	out.push({ kind: "Indent", fn: (_) => 0 });

	return out;
};

exports.Function = function Function({ node, print }) {
	const out = [];

	out.push({
		kind: "Line",
		force: true,
		lines: 2,
		tag: "Function",
	});

	out.push({ kind: "Indent", fn: (_) => 0 });
	out.push("=== ");
	out.push("function ");
	out.push(print(node.identifier));

	if (node.args?.length > 0) {
		out.push("(");
		out.push(join(", ", print(node.args)));
		out.push(")");
	}

	out.push({ kind: "Line", force: false });

	out.push({ kind: "Indent", fn: (_) => 2 });
	out.push(print(node.content));
	out.push({ kind: "Indent", fn: (_) => 0 });

	out.push({
		kind: "Line",
		force: true,
		lines: 2,
	});

	return out;
};

exports.Stitch = function Stitch({ node, print }) {
	const out = [];
	out.push({ kind: "Line", force: true, lines: 2 });
	out.push({ kind: "Indent", fn: (_) => 0 });

	out.push("= ");
	out.push(print(node.identifier));

	if (node.args?.length > 0) {
		out.push("(");
		out.push(join(", ", print(node.args)));
		out.push(")");
	}

	out.push({ kind: "Line", force: false });

	out.push({ kind: "Indent", fn: (_) => 2 });
	out.push(print(node.content));
	out.push({ kind: "Indent", fn: (_) => 0 });

	return out;
};

exports.Argument = function Argument({ node, print }) {
	const out = [];
	if (node.isByReference) {
		out.push("ref");
	}

	if (node.isDivertTarget) {
		out.push("->");
	}

	out.push(print(node.identifier));

	return out.join(" ");
};

exports.Weave = function Weave({ node, print }) {
	return print(node.content);
};

exports.DivertTarget = function DivertTarget({ node, print, context }) {
	return print(node.divert, { ...context, isInline: true });
};

exports.Divert = function Divert({ node, print, context }) {
	const out = [];

	if (
		!node.isFunctionCall &&
		!node.isThread &&
		!getSibling(node, -1)?.isTunnel
	) {
		out.push("-> ");
	}

	if (!node.isFunctionCall && node.isThread) {
		out.push("<- ");
	}

	out.push(print(node.target));

	if (node.args.length > 0) {
		out.push("(");
		out.push(join(", ", print(node.args)));
		out.push(")");
	} else if (node.isFunctionCall) {
		out.push("()");
	}

	if (!node.isFunctionCall && !context.isInline && !node.isTunnel) {
		out.push({ kind: "Line", force: false });
	}

	if (node.isTunnel) {
		out.push(" -> ");

		if (getKind(getSibling(node, +1)) !== "Divert" && !context.isInline) {
			out.push({ kind: "Line", force: false });
		}
	}

	return out;
};

exports.TunnelOnwards = function TunnelOnwards() {
	return ["->->", { kind: "Line", force: false }];
};

function SequenceShortName({ node, print }) {
	const out = [];
	out.push("{");

	if (node.sequenceType === 2) {
		out.push("&");
	}
	if (node.sequenceType === 4) {
		out.push("~");
	}
	if (node.sequenceType === 8) {
		out.push("!");
	}

	out.push(join("|", print(node.sequenceElements)));

	out.push("}");

	return out;
}

function SequenceMultiLine({ node, print, context }, validChildren) {
	const out = [];
	out.push("{");

	const { sequenceType } = node;

	const sequenceKind = [
		sequenceType & 1 ? "stopping" : null,
		sequenceType & 2 ? "cycle" : null,
		sequenceType & 4 ? "shuffle" : null,
		sequenceType & 8 ? "once" : null,
	]
		.filter(Boolean)
		.join(" ");

	out.push(sequenceKind);
	out.push(":");
	out.push({ kind: "Line", force: true });
	out.push({ kind: "Indent", fn: (x) => x + 2 });

	out.push(
		join(
			{ kind: "Line", force: true },
			print(validChildren, {
				...context,
				isInline: false,
			})
				.map(([first, ...rest]) =>
					rest.length > 0
						? [
								first,
								{ kind: "Indent", fn: (x) => x + 1 },
								...rest,
								{ kind: "Indent", fn: (x) => x - 1 },
							]
						: first,
				)

				.map((x) => ["- ", x]),
		),
	);

	out.push({ kind: "Indent", fn: (x) => x - 2 });

	out.push({ kind: "Line", force: true });

	out.push("}");
	return out;
}

function SequenceNamed({ node, print, context }, validChildren) {
	const out = [];
	out.push("{");

	const { sequenceType } = node;

	const sequenceKind = [
		sequenceType & 1 ? "stopping" : null,
		sequenceType & 2 ? "cycle" : null,
		sequenceType & 4 ? "shuffle" : null,
		sequenceType & 8 ? "once" : null,
	]
		.filter(Boolean)
		.join(" ");

	out.push(sequenceKind);
	out.push(":");
	out.push({ kind: "Indent", fn: (x) => x + 2 });

	out.push(
		join(
			{ kind: "Line", force: true },
			print(validChildren, {
				...context,
				isInline: true,
			}),
		),
	);

	out.push({ kind: "Indent", fn: (x) => x - 2 });

	out.push("}");
	return out;
}

exports.Sequence = function Sequence({ node, print, context }) {
	const isInline = !node.sequenceElements.some(
		({ content: { length } }) => length > 1,
	);

	if (isInline) {
		return SequenceShortName({ node, print, context });
	} else {
		const validChildren = node.sequenceElements.map((child) => ({
			...child,
			content: child.content.filter(({ text }, i, { length }) => {
				if (i === 0 && text === "\n") {
					return false;
				}
				if (i === length - 1 && text === "\n") {
					return false;
				}

				return true;
			}),
		}));

		const multiLine = validChildren.length > 1;

		if (multiLine) {
			return SequenceMultiLine({ node, print, context }, validChildren);
		} else {
			return SequenceNamed({ node, print, context }, validChildren);
		}
	}
};

exports.Path = function Path({ node, print, context }) {
	const path = [...print(node.components, context)];
	return path.join(".");
};

exports.Identifier = function Identifier({ node }) {
	return node.name;
};

exports.Number = function Number({ node }) {
	return node.value + "";
};

exports.Glue = function Glue() {
	return "<>";
};

exports.ListDefinition = function ListDefinition({ node, print }) {
	if (node.itemDefinitions < 5) {
		return join(", ", print(node.itemDefinitions));
	} else {
		let i = 0;
		let lineLength = 0;
		const acc = [];

		const breakByExplicitValue = node.itemDefinitions.some(
			({ explicitValue }) => explicitValue !== null,
		);

		for (const def of node.itemDefinitions) {
			const printed = print(def);
			lineLength += printed.flat(Infinity).join("").length;

			if (
				i !== 0 &&
				((breakByExplicitValue && def.explicitValue !== null) ||
					(breakByExplicitValue && lineLength > 80))
			) {
				acc.push({ kind: "Line" });
				lineLength = 0;
			}

			acc.push(printed);

			if (++i < node.itemDefinitions.length) {
				acc.push(", ");
			}
		}

		return acc;
	}
};

exports.ListElement = function ListElement({ node, print }) {
	const out = [];

	if (node.inInitialList) {
		out.push("(");
		out.push(print(node.indentifier));
		out.push(")");
	} else {
		out.push(print(node.indentifier));
	}

	if (typeof node.explicitValue === "number") {
		out.push(" = ");
		out.push(node.explicitValue + "");
	}

	return out;
};

exports.IncDecExpression = function IncDecExpression({ node, print }) {
	return [
		{ kind: "Line", force: false },
		"~ ",
		print(node.varIdentifier),
		node.expression
			? [node.isInc ? " += " : " -= ", print(node.expression)]
			: node.isInc
				? "++"
				: "--",
		{ kind: "Line", force: false },
	];
};

exports.String = function String({ node, print }) {
	return ['"', print(node.content), '"'];
};

exports.UnaryExpression = function UnaryExpression({ node, print }) {
	return [
		node.opName || node.op,
		" ",
		wrapSubExpression(print, node.innerExpression),
	];
};
exports.BinaryExpression = function BinaryExpression({ node, print }) {
	return [
		wrapSubExpression(print, node.leftExpression),
		" ",
		node.opName || node.op,
		" ",
		wrapSubExpression(print, node.rightExpression),
	];
};

exports.List = function List({ node, print }) {
	return ["(", join(", ", print(node.itemIdentifierList ?? [])), ")"];
};

exports.LIST = function LIST({ node, print, context }) {
	const selfRendered = [
		"LIST ",
		print(node.variableIdentifier),
		" = ",
		print(node.listDefinition),
	];

	if (context.isSibblingCheck) {
		return selfRendered;
	}

	const prev = getSibling(node, -1);
	const prevRendered =
		getKind(prev) === "LIST"
			? print(prev, { ...context, isSibblingCheck: true })
			: [];

	const needsLeadingLine =
		getLinesInRendered(selfRendered) + getLinesInRendered(prevRendered) > 0;

	return printIsolatedExpression([
		needsLeadingLine ? { kind: "Line", lines: 2 } : [],
		selfRendered,
		getKind(getSibling(node, +1)) !== "LIST"
			? { kind: "Line", force: true, lines: 2 }
			: [],
	]);
};

exports.CONST = function CONST({ node, print }) {
	return printIsolatedExpression([
		"CONST ",
		print(node.constantIdentifier),
		" = ",
		print(node.expression),
		getKind(getSibling(node, +1)) !== "CONST"
			? { kind: "Line", force: true, lines: 2 }
			: [],
	]);
};

exports.VAR = function VAR({ node, print }) {
	return printIsolatedExpression([
		"VAR ",
		print(node.variableIdentifier),
		" = ",
		print(node.expression),
		getKind(getSibling(node, +1)) !== "VAR"
			? { kind: "Line", force: true, lines: 2 }
			: [],
	]);
};

exports.EXTERNAL = function EXTERNAL({ node, print }) {
	return printIsolatedExpression([
		{ kind: "Line", force: true, lines: 2, tagged: "EXTERNAL" },
		"EXTERNAL ",
		print(node.identifier),
		"(",
		node.argumentNames.join(", "),
		")",
		{
			kind: "Line",
			force: true,
			lines: 2,
			tag: "EXTERNAL",
		},
	]);
};

exports.temp = function temp({ node, print }) {
	return printIsolatedExpression(
		[
			"~ temp ",
			print(node.variableIdentifier),
			" = ",
			print(node.expression),
		],
		true,
	);
};

exports["variable assignment"] = function variableAssignment({ node, print }) {
	return printIsolatedExpression(
		[
			"~ ",
			print(node.variableIdentifier),
			" = ",
			print(node.expression),
			{ kind: "Line", force: false },
		],
		true,
	);
};

exports.IncludedFile = function IncludedFile({ node, print }) {
	return [
		print(node.includedStory),
		getKind(getSibling(node, +1)) !== "IncludedFile"
			? { kind: "Line", force: true, lines: 2 }
			: [],
	];
};

exports.Story = function Story({ node, print }) {
	return printIsolatedExpression([
		`INCLUDE ${node.content[0].content[0]._debugMetadata.fileName}`,
	]);
};

exports.ReturnType = function ReturnType({ node, print }) {
	return [
		"~ return ",
		print(node.returnedExpression),
		{ kind: "Line", force: false },
	];
};
