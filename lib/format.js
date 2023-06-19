let InkParser = null;

try {
  InkParser = require("inkjs/compiler/Parser/InkParser").InkParser;
} catch (e) {
  InkParser = require("../vendor/inkjs/compiler/Parser/InkParser").InkParser;
}

const { getKind, logNode, tap, tapJSON } = require("./util");

let halt = false;

function render(node, context) {
  function print(node, printContext = context) {
    return render(node, printContext);
  }

  function printIndent() {
    return new Array(Math.max(0, context.indent || 0)).fill("    ").join("");
  }
  function printIndentedNewline() {
    return "\n" + printIndent();
  }

  switch (getKind(node)) {
    case "Null": {
      return;
    }

    case "AuthorWarning": {
      return ["TODO: ", node.warningMessage];
    }

    case "Array": {
      return node.map((child) => print(child));
    }

    case "IncludedFile": {
      return print(node.includedStory);
    }
    case "Story": {
      return `INCLUDE ${node.content[0].content[0]._debugMetadata.fileName}\n`;
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
        context.indent++;
        out.push(printIndentedNewline());
        out.push(print(node.branches));
        context.indent--;
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
        return printIndentedNewline();
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

      context.indent = node.indentationDepth;

      out.push({ kind: "ResetIndent" });
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

      out.push(printIndentedNewline());

      return out;
    }

    case "Gather": {
      const out = [];
      context.indent = node.indentationDepth - 1;

      out.push({ kind: "ResetIndent" });
      out.push(new Array(node.indentationDepth).fill("  ").join(""));
      out.push(new Array(node.indentationDepth).fill("- ").join(""));

      if (node.identifier) {
        out.push("(");
        out.push(print(node.identifier));
        out.push(") ");
      }

      return out;
    }

    case "Function":
    case "Knot": {
      const out = [];
      out.push("\n\n");
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

      if (node.isFunction) {
        out.push("\n");
      } else {
        out.push(" ===\n");
      }

      context.indent = 0;
      out.push(print(node.content));
      context.indent = 0;

      return out;
    }

    case "Stitch": {
      const out = [];
      out.push("\n");
      out.push("= ");
      out.push(print(node.identifier));
      out.push("\n");

      context.indent = 0;
      out.push(print(node.content));
      context.indent = 0;

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
        return ["-> ", print(node.target, context)];
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
        "\n",
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

    case "LIST": {
      return [
        "LIST ",
        print(node.variableIdentifier),
        " = ",
        print(node.listDefinition),
        "\n",
      ];
    }

    case "CONST": {
      return [
        "CONST ",
        print(node.constantIdentifier),
        " = ",
        print(node.expression),
        "\n",
      ];
    }

    case "VAR": {
      return [
        "VAR ",
        print(node.variableIdentifier),
        " = ",
        print(node.expression),
        "\n",
      ];
    }

    case "temp": {
      return [
        "~ temp ",
        print(node.variableIdentifier),
        " = ",
        print(node.expression),
        "\n",
      ];
    }

    case "variable assignment": {
      return [
        "~ ",
        print(node.variableIdentifier),
        " = ",
        print(node.expression),
        "\n",
      ];
    }

    case "ReturnType": {
      return ["~ return ", print(node.returnedExpression), "\n"];
    }

    default: {
      throw new Error(`unhandled kind ${getKind(node)}`);
    }
  }
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

  if (halt) {
    logNode(halt, getKind(halt));
  }

  return out
    .flat(999)
    .filter(Boolean)
    .reduce((acc, val) => {
      if (val.kind === "ResetIndent") {
        return acc.trimEnd() + "\n";
      } else {
        return acc + val;
      }
    }, "")
    .trim();
};
