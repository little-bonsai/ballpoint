const { pipe, getKind, logNode, tap, tapJSON } = require("./util");

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

module.exports = function render(node, context) {
	function print(node, printContext = context) {
		return render(node, printContext);
	}

	if (
		context.comments.length > 0 &&
		context.getNodeSourceIndex(node) > context.comments[0]?.index
	) {
		const comment = context.comments.shift();

		return [comment.text, { kind: "Line", force: false }, print(node)];
	}

	switch (getKind(node)) {
		case "Null": {
			return;
		}

		case "AuthorWarning": {
			return [
				"TODO: ",
				node.warningMessage,
				{ kind: "Line", force: false },
			];
		}

		case "Array": {
			return node.map((child) => print(child));
		}

		case "IncludedFile": {
			return print(node.includedStory);
		}
		case "Story": {
			return [
				`INCLUDE ${node.content[0].content[0]._debugMetadata.fileName}`,
				{ kind: "Line", force: false },
			];
		}

		case "Conditional": {
			const out = [];
			const isInline = node.content.some((child) => child.isInline);

			if (isInline) {
				out.push("{");
				if (node.initialCondition) {
					out.push(print(node.initialCondition));
					out.push(":");
				}
				out.push(print(node.branches));
				out.push("}");
			} else {
				out.push("{");
				if (node.initialCondition) {
					out.push(print(node.initialCondition));
					out.push(":");
				} else {
					context.isSwitchCase = true;
				}
				out.push({ kind: "Line", force: true });
				out.push({ kind: "Indent", fn: (x) => x + 1 });
				out.push(
					print(node.branches).map((x) => [
						x,
						{ kind: "Line", force: false },
					])
				);
				out.push({ kind: "Indent", fn: (x) => x - 1 });
				out.push("}");
			}

			context.isSwitchCase = false;
			return out;
		}

		case "ConditionalSingleBranch": {
			const out = [];

			const { isInline } = node;
			const subContext = { ...context, isInline };

			if (node.isInline) {
				if (node.isElse) {
					out.push("|");
					out.push(print(node.content, subContext));
				} else if (node.isTrueBranch) {
					out.push(print(node.content, subContext));
				}
			} else {
				let child = null;

				if (node.isElse) {
					out.push({ kind: "Indent", fn: (x) => x - 1 });
					out.push("- else: ");
					out.push({ kind: "Line", force: false });
					out.push({ kind: "Indent", fn: (x) => x + 1 });
					child = node.content;
				} else if (node.isTrueBranch) {
					child = node.content;
				} else if (node.matchingEquality || context.isSwitchCase) {
					out.push("- ");
					out.push(print(node.content[1]));
					out.push(": ");
					child = node.content[0];
				}

				if (
					node.content[0].content.length > 1 &&
					node.content[0].content[1].text !== "\n"
				) {
					out.push({ kind: "Indent", fn: (x) => x + 1 });
					out.push({ kind: "Line", force: false });
					out.push(print(child));
					out.push({ kind: "Indent", fn: (x) => x - 1 });
				} else {
					out.push(print(child));
				}
			}

			return out;
		}

		case "ref": {
			if (node.outputWhenComplete) {
				return ["{", print(node.pathIdentifiers), "}"];
			} else {
				return join(".", print(node.pathIdentifiers));
			}
		}

		case "ContentList": {
			return print(node.content, context);
		}

		case "FunctionCall": {
			const out = [];
			const isTopLevel =
				node.outputWhenComplete || node.shouldPopReturnedValue;

			if (isTopLevel) {
				const isInline = node.outputWhenComplete;
				if (isInline) {
					out.push("{");
					out.push(print(node.content, { ...context, isInline }));
					out.push("}");
				} else {
					out.push("~ ");
					out.push(print(node.content, { ...context, isInline }));
				}
			} else {
				out.push(print(node.content, context));
			}

			return out;
		}

		case "Text": {
			if (node.text === "\n") {
				return { kind: "Line", force: true };
			} else {
				return node.text;
			}
		}

		case "Tag": {
			if (node.isStart) {
				return "#";
			}
			return;
		}

		case "MultipleConditionExpression": {
			const out = [];
			for (const child of print(node.content)) {
				out.push("{ ");
				out.push(child);
				out.push(" } ");
				out.push({ kind: "Line", force: false });
			}

			return out;
		}

		case "Choice": {
			const out = [{ kind: "Line", force: false }];
			const hasSquareBrackets =
				node.choiceOnlyContent ||
				(getKind(node.innerContent?.content?.[0]) === "Text" &&
					node.innerContent?.content?.[0].text !== "\n");

			out.push({
				kind: "Indent",
				fn: (_) => node.indentationDepth,
				mayBreak: true,
			});
			out.push({ kind: "DisableIndent" });
			out.push(new Array(node.indentationDepth).fill("  ").join(""));
			out.push(
				new Array(node.indentationDepth)
					.fill(node.onceOnly ? "* " : "+ ")
					.join("")
			);

			if (node.identifier) {
				out.push("(");
				out.push(print(node.identifier));
				out.push(") ");
			}

			if (node._condition) {
				if (
					getKind(node._condition) === "MultipleConditionExpression"
				) {
					out.push({ kind: "EnableIndent" });
					out.push(print(node._condition));
				} else {
					out.push("{");
					out.push(print(node._condition));
					out.push("} ");
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
		}

		case "Gather": {
			const out = [];

			out.push({ kind: "Line", force: true });
			out.push({ kind: "DisableIndent" });
			out.push(new Array(node.indentationDepth).fill("  ").join(""));
			out.push(new Array(node.indentationDepth).fill("- ").join(""));

			if (node.identifier) {
				out.push("(");
				out.push(print(node.identifier));
				out.push(") ");
			}

			out.push({ kind: "EnableIndent" });
			out.push({
				kind: "Indent",
				fn: (_) => node.indentationDepth,
				mayBreak: true,
			});

			return out;
		}

		case "Function":
		case "Knot": {
			const out = [];
			out.push({ kind: "Line", force: true, lines: 2 });
			out.push({ kind: "Indent", fn: (_) => 0 });
			out.push("=== ");
			if (node.isFunction) {
				out.push("function ");
			}
			out.push(print(node.identifier));

			if (node.args?.length > 0) {
				out.push("(");
				out.push(join(", ", print(node.args)));
				out.push(")");
			}

			if (!node.isFunction) {
				out.push(" ===");
			}
			out.push({ kind: "Line", force: false });

			out.push({ kind: "Indent", fn: (_) => (node.isFunction ? 1 : 0) });
			out.push(print(node.content));
			out.push({ kind: "Indent", fn: (_) => 0 });

			return out;
		}

		case "Stitch": {
			const out = [];
			out.push({ kind: "Line", force: true });
			out.push({ kind: "Indent", fn: (_) => 0 });

			out.push("= ");
			out.push(print(node.identifier));

			if (node.args?.length > 0) {
				out.push("(");
				out.push(join(", ", print(node.args)));
				out.push(")");
			}

			out.push({ kind: "Line", force: false });

			out.push({ kind: "Indent", fn: (_) => 0 });
			out.push(print(node.content));
			out.push({ kind: "Indent", fn: (_) => 0 });

			return out;
		}

		case "Argument": {
			const out = [];
			if (node.isByReference) {
				out.push("ref");
			}

			if (node.isDivertTarget) {
				out.push("->");
			}

			out.push(print(node.identifier));

			return out.join(" ");
		}

		case "Weave": {
			return print(node.content);
		}

		case "DivertTarget": {
			return print(node.divert, { ...context, isInline: true });
		}

		case "Divert": {
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
			}

			return out;
		}

		case "TunnelOnwards": {
			return ["->->", { kind: "Line", force: false }];
		}

		case "Sequence": {
			const out = [];
			out.push("{");

			const isInline = !node.sequenceElements.some(
				({ content: { length } }) => length > 1
			);

			if (isInline) {
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
				if (multiLine) {
					out.push({ kind: "Line", force: true });
				}
				out.push({ kind: "Indent", fn: (x) => x + 1 });

				out.push(
					join(
						{ kind: "Line", force: true },
						print(validChildren, {
							...context,
							isInline: !multiLine,
						}).map((x) => (multiLine ? ["- ", x] : x))
					)
				);

				out.push({ kind: "Indent", fn: (x) => x - 1 });

				if (multiLine) {
					out.push({ kind: "Line", force: true });
				}
			}

			out.push("}");

			return out;
		}

		case "Path": {
			const path = [...print(node.components, context)];
			return path.join(".");
		}

		case "Identifier": {
			return node.name;
		}

		case "Number": {
			return node.value + "";
		}

		case "Glue": {
			return "<>";
		}

		case "ListDefinition": {
			return [...print(node.itemDefinitions)].join(", ");
		}

		case "ListElement": {
			if (node.inInitialList) {
				return ["(", ...print(node.indentifier), ")"].join("");
			} else {
				return print(node.indentifier);
			}
		}

		case "IncDecExpression": {
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
		}

		case "String": {
			return ['"', node.toString(), '"'];
		}

		case "UnaryExpression": {
			return [
				node.opName || node.op,
				" ",
				wrapSubExpression(print, node.innerExpression),
			];
		}
		case "BinaryExpression": {
			return [
				wrapSubExpression(print, node.leftExpression),
				" ",
				node.opName || node.op,
				" ",
				wrapSubExpression(print, node.rightExpression),
			];
		}

		case "List": {
			return ["(", join(", ", print(node.itemIdentifierList ?? [])), ")"];
		}

		case "LIST": {
			return printIsolatedExpression([
				"LIST ",
				print(node.variableIdentifier),
				" = ",
				print(node.listDefinition),
			]);
		}

		case "CONST": {
			return printIsolatedExpression([
				"CONST ",
				print(node.constantIdentifier),
				" = ",
				print(node.expression),
			]);
		}

		case "VAR": {
			return printIsolatedExpression([
				"VAR ",
				print(node.variableIdentifier),
				" = ",
				print(node.expression),
			]);
		}

		case "EXTERNAL": {
			return printIsolatedExpression([
				"EXTERNAL ",
				print(node.identifier),
				"(",
				node.argumentNames.join(", "),
				")",
			]);
		}

		case "temp": {
			return printIsolatedExpression(
				[
					"~ temp ",
					print(node.variableIdentifier),
					" = ",
					print(node.expression),
				],
				true
			);
		}

		case "variable assignment": {
			return printIsolatedExpression(
				[
					"~ ",
					print(node.variableIdentifier),
					" = ",
					print(node.expression),
					{ kind: "Line", force: false },
				],
				true
			);
		}

		case "ReturnType": {
			return [
				"~ return ",
				print(node.returnedExpression),
				{ kind: "Line", force: false },
			];
		}

		/* istanbul ignore next */
		default: {
			console.error(node);
			throw new Error(`unhandled kind ${getKind(node)}`);
		}
	}
};
