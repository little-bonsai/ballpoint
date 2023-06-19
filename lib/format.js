let InkParser = null;

try {
  InkParser = require("inkjs/compiler/Parser/InkParser").InkParser;
} catch (e) {
  InkParser = require("../vendor/inkjs/compiler/Parser/InkParser").InkParser;
}

const { getKind, logNode, tap, tapJSON } = require("./util");

function pipe(...fns) {
  return function doPipe(data) {
    return fns.reduce((data, fn) => fn(data), data);
  };
}

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

  const context = {};
  const out = [...render(ast, context)];

  return pipe(
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
    (x) => x.filter((node) => node !== ""),
    (x) =>
      x.reduce(function applyLineBreaks(lines, node) {
        if (node.kind === "LineBreak") {
          return [...lines, new Array(node.lines ?? 1).fill("\n").join("")];
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
              lines.at(-1) + new Array(node.lines ?? 1).fill("\n").join(""),
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
        function applyIndentation({ lines, indent, enabled }, node, i, nodes) {
          if (typeof node === "string") {
            return {
              indent,
              enabled,
              lines: [
                ...lines,
                new Array(indent).fill(enabled ? "    " : "").join("") + node,
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
    ({ lines }) => lines,
    (x) => x.filter((node) => typeof node === "string"),
    (x) => x.join(""),
    (x) => x.trim()
  )(out);
};

function render(node, context) {
  function print(node, printContext = context) {
    return render(node, printContext);
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
      return `INCLUDE ${node.content[0].content[0]._debugMetadata.fileName}`;
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
          print(node.branches).map((x) => [x, { kind: "TrailingLine" }])
        );
        out.push({ kind: "Indent", fn: (x) => x - 1 });
        out.push("}");
      }

      context.isSwitchCase = false;
      return out;
    }

    case "ConditionalSingleBranch": {
      const out = [];

      if (node.isElse) {
        if (node.isInline) {
          out.push("|");
          out.push(print(node.content));
        } else {
          out.push("- else: ");
          out.push(print(node.content));
        }
        return out;
      }

      if (node.isTrueBranch) {
        if (node.isInline) {
          out.push(print(node.content));
        } else {
          out.push(print(node.content));
        }
        return out;
      }

      if (node.matchingEquality || context.isSwitchCase) {
        out.push("- ");
        out.push(print(node.content[1]));
        out.push(": ");
        out.push(print(node.content[0]));
        return out;
      }

      return out;
    }

    case "ref": {
      return print(node.pathIdentifiers);
    }

    case "ContentList": {
      return print(node.content, context);
    }

    case "FunctionCall": {
      const out = [];
      const isTopLevel = node.outputWhenComplete || node.shouldPopReturnedValue;

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
      }

      return out;
    }

    case "Choice": {
      const out = [];
      const hasSquareBrackets =
        node.innerContent?.content?.[0]?.text !== "\n" ||
        node.choiceOnlyContent;

      out.push({ kind: "DisableIndent" });
      out.push(new Array(node.indentationDepth).fill("  ").join(""));
      out.push(
        new Array(node.indentationDepth)
          .fill(node.onceOnly ? "* " : "+ ")
          .join("")
      );

      if (node._condition) {
        if (getKind(node._condition) === "MultipleConditionExpression") {
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
        out.push(print(node.innerContent));
      }

      out.push({ kind: "TrailingLine" });
      out.push({ kind: "Indent", fn: (_) => node.indentationDepth });
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

    case "Divert": {
      if (node.isFunctionCall) {
        const args = [];

        for (const arg of node.args) {
          args.push([...print(arg)].join(""));
        }

        const call = [...print(node.target), "(", args.join(", "), ")"].join(
          ""
        );

        return call;
      } else {
        return ["-> ", print(node.target, context), { kind: "TrailingLine" }];
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
      throw new Error(`unhandled kind ${getKind(node)}`);
    }
  }
}
