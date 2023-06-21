const { pipe, getKind, logNode, tap, tapJSON } = require("./util");

module.exports = function render(node, context) {
	function print(node, printContext = context) {
		return render(node, printContext);
	}

	if (
		context.comments.length > 0 &&
		context.getNodeSourceIndex(node) > context.comments[0]?.index
	) {
		const comment = context.comments.shift();

		return [comment.text, { kind: "TrailingLine" }, print(node)];
	}

	switch (getKind(node)) {
		case "Null": {
			return;
		}

		case "AuthorWarning": {
			return ["TODO: ", node.warningMessage, { kind: "TrailingLine" }];
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
				{ kind: "TrailingLine" },
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
				out.push({ kind: "LineBreak" });
				out.push({ kind: "Indent", fn: (x) => x + 1 });
				out.push(
					print(node.branches).map((x) => [
						x,
						{ kind: "TrailingLine" },
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

			if (node.isElse) {
				if (node.isInline) {
					out.push("|");
					out.push(print(node.content, subContext));
				} else {
					out.push("- else: ");
					out.push(print(node.content));
				}
				return out;
			}

			if (node.isTrueBranch) {
				if (node.isInline) {
					out.push(print(node.content, subContext));
				} else {
					out.push(print(node.content));
				}
				return out;
			}

			if (node.matchingEquality || context.isSwitchCase) {
				out.push("- ");
				out.push(print(node.content[1]));
				out.push(": ");
				out.push(print(node.content[0], subContext));
				return out;
			}
		}

		case "ref": {
			return print(node.pathIdentifiers);
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
				return { kind: "LineBreak" };
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
				out.push({ kind: "TrailingLine" });
			}

			return out;
		}

		case "Choice": {
			const out = [];
			const hasSquareBrackets =
				node.choiceOnlyContent ||
				(getKind(node.innerContent?.content?.[0]) === "Text" &&
					node.innerContent?.content?.[0].text !== "\n");

			out.push({ kind: "Indent", fn: (_) => node.indentationDepth });
			out.push({ kind: "DisableIndent" });
			out.push(new Array(node.indentationDepth).fill("  ").join(""));
			out.push(
				new Array(node.indentationDepth)
					.fill(node.onceOnly ? "* " : "+ ")
					.join("")
			);

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
			}

			if (node.identifier) {
				out.push("(");
				out.push(print(node.identifier));
				out.push(") ");
			}

			out.push(print(node.startContent, context));

			if (hasSquareBrackets) {
				out.push("[");
				out.push(print(node.choiceOnlyContent));
				out.push("]");
			}

			out.push(print(node.innerContent));

			out.push({ kind: "TrailingLine" });
			out.push({ kind: "EnableIndent" });

			return out;
		}

		case "Gather": {
			const out = [];

			out.push({ kind: "DisableIndent" });
			out.push(new Array(node.indentationDepth).fill("  ").join(""));
			out.push(new Array(node.indentationDepth).fill("- ").join(""));

			if (node.identifier) {
				out.push("(");
				out.push(print(node.identifier));
				out.push(") ");
			}

			out.push({ kind: "EnableIndent" });
			out.push({ kind: "Indent", fn: (_) => node.indentationDepth - 1 });

			return out;
		}

		case "Function":
		case "Knot": {
			const out = [];
			out.push({ kind: "LineBreak", lines: 2 });
			out.push({ kind: "Indent", fn: (_) => 0 });
			out.push("=== ");
			if (node.isFunction) {
				out.push("function ");
			}
			out.push(print(node.identifier));

			if (node.args?.length > 0) {
				out.push(" (");
				out.push(print(node.args).join(", "));
				out.push(")");
			}

			if (!node.isFunction) {
				out.push(" ===");
			}
			out.push({ kind: "TrailingLine" });

			out.push({ kind: "Indent", fn: (_) => 0 });
			out.push(print(node.content));
			out.push({ kind: "Indent", fn: (_) => 0 });

			return out;
		}

		case "Stitch": {
			const out = [];
			out.push({ kind: "LineBreak" });
			out.push({ kind: "Indent", fn: (_) => 0 });
			out.push("= ");
			out.push(print(node.identifier));
			out.push({ kind: "TrailingLine" });

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
			if (node.isFunctionCall) {
				const args = [];

				for (const arg of node.args) {
					args.push([...print(arg)].join(""));
				}

				const call = [
					...print(node.target),
					"(",
					args.join(", "),
					")",
				].join("");

				return call;
			} else {
				return [
					node.isThread ? " <- " : "-> ",
					print(node.target, context),
					context.isInline ? "" : { kind: "TrailingLine" },
				];
			}
		}

		case "TunnelOnwards": {
			return "->->";
		}

		case "Sequence": {
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

			out.push(print(node.sequenceElements).join("|"));

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
				"~ ",
				print(node.varIdentifier),
				node.expression
					? [
							node.isInc ? " += " : " -= ",
							[...print(node.expression)].join(""),
					  ].join("")
					: node.isInc
					? "++"
					: "--",
				{ kind: "LineBreak" },
			];
		}

		case "String": {
			return ['"', node.toString(), '"'];
		}
		case "UnaryExpression": {
			return [node.opName || node.op, " ", print(node.innerExpression)];
		}
		case "BinaryExpression": {
			return [
				print(node.leftExpression),
				" ",
				node.opName || node.op,
				" ",
				print(node.rightExpression),
			];
		}

		case "List": {
			return ["(", print(node.content).join(","), ")"];
		}

		case "LIST": {
			return [
				"LIST ",
				print(node.variableIdentifier),
				" = ",
				print(node.listDefinition),
				{ kind: "LineBreak" },
			];
		}

		case "CONST": {
			return [
				"CONST ",
				print(node.constantIdentifier),
				" = ",
				print(node.expression),
				{ kind: "LineBreak" },
			];
		}

		case "VAR": {
			return [
				"VAR ",
				print(node.variableIdentifier),
				" = ",
				print(node.expression),
				{ kind: "LineBreak" },
			];
		}

		case "EXTERNAL": {
			return [
				"EXTERNAL ",
				print(node.identifier),
				"(",
				node.argumentNames.join(", "),
				")",
				{ kind: "LineBreak" },
			];
		}

		case "temp": {
			return [
				"~ temp ",
				print(node.variableIdentifier),
				" = ",
				print(node.expression),

				{ kind: "LineBreak" },
			];
		}

		case "variable assignment": {
			return [
				"~ ",
				print(node.variableIdentifier),
				" = ",
				print(node.expression),
				{ kind: "LineBreak" },
			];
		}

		case "ReturnType": {
			return [
				"~ return ",
				print(node.returnedExpression),
				{ kind: "LineBreak" },
			];
		}

		default: {
			console.error(node);
			throw new Error(`unhandled kind ${getKind(node)}`);
		}
	}
};
