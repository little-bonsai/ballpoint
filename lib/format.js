const { InkParser } = require("inkjs/compiler/Parser/InkParser");
const { StatementLevel } = require("inkjs/compiler/parser/StatementLevel");

const { getKind, logNode, tap, tapJSON } = require("./util");

let halt = false;

function* render(node, context) {
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
      yield "TODO: ";
      yield node.warningMessage;
      return;
    }

    case "Array": {
      for (const child of node) {
        yield* print(child, context);
      }
      return;
    }

    case "Conditional": {
      const isInline = node.content.some((child) => child.isInline);

      if (isInline) {
        yield "{";
        if (node.initialCondition) {
          yield* print(node.initialCondition);
          yield ":";
        }
        yield* print(node.branches);
        yield "}";
      } else {
        yield "{";
        if (node.initialCondition) {
          yield* print(node.initialCondition);
          yield ":";
        } else {
          context.isSwitchCase = true;
        }
        context.indent++;
        yield printIndentedNewline();
        yield* print(node.branches);
        context.indent--;
        yield "}";
      }

      context.isSwitchCase = false;
      return;
    }

    case "ConditionalSingleBranch": {
      if (node.isElse) {
        if (node.isInline) {
          yield "|";
          yield* print(node.content);
        } else {
          yield "- else: ";
          yield* print(node.content);
        }
        return;
      }

      if (node.isTrueBranch) {
        if (node.isInline) {
          yield* print(node.content);
        } else {
          yield* print(node.content);
        }
      }

      if (node.matchingEquality || context.isSwitchCase) {
        yield "- ";
        yield* print(node.content[1]);
        yield ": ";
        yield* print(node.content[0]);
      }

      return;
    }

    case "ref": {
      yield* print(node.pathIdentifiers);
    }

    case "ContentList": {
      return yield* print(node.content, context);
    }

    case "FunctionCall": {
      const isTopLevel = node.outputWhenComplete || node.shouldPopReturnedValue;

      if (isTopLevel) {
        const isInline = node.outputWhenComplete;
        if (isInline) {
          yield "{";
          yield* print(node.content, { ...context, isInline });
          yield "}";
        } else {
          yield "~ ";
          yield* print(node.content, { ...context, isInline });
          yield "\n";
        }
      } else {
        yield* print(node.content, context);
      }

      return;
    }

    case "Text": {
      if (node.text === "\n") {
        return yield printIndentedNewline();
      } else {
        return yield node.text;
      }
    }

    case "Tag": {
      if (node.isStart) {
        yield "#";
      }
      return;
    }

    case "MultipleConditionExpression": {
      for (const child of print(node.content)) {
        yield "{ ";
        yield child;
        yield " } ";
      }
      return;
    }

    case "Choice": {
      const hasSquareBrackets =
        node.innerContent?.content?.[0]?.text !== "\n" ||
        node.choiceOnlyContent;

      context.indent = node.indentationDepth;

      yield { kind: "ResetIndent" };
      yield new Array(node.indentationDepth).fill("  ").join("");
      yield new Array(node.indentationDepth)
        .fill(node.onceOnly ? "* " : "+ ")
        .join("");

      if (node._condition) {
        if (getKind(node._condition) === "MultipleConditionExpression") {
          yield* print(node._condition);
        } else {
          yield "{";
          yield* print(node._condition);
          yield "} ";
        }
      }

      if (node.identifier) {
        yield "(";
        yield* print(node.identifier);
        yield ") ";
      }

      yield* print(node.startContent, context);

      if (hasSquareBrackets) {
        yield "[";
        yield* print(node.choiceOnlyContent);
        yield "]";
        yield* print(node.innerContent);
      }

      yield* printIndentedNewline();

      return;
    }

    case "Gather": {
      context.indent = node.indentationDepth - 1;

      yield { kind: "ResetIndent" };
      yield new Array(node.indentationDepth).fill("  ").join("");
      yield new Array(node.indentationDepth).fill("- ").join("");

      if (node.identifier) {
        yield "(";
        yield* print(node.identifier);
        yield ") ";
      }

      return;
    }

    case "Function":
    case "Knot": {
      yield "\n";
      yield "=== ";
      if (node.isFunction) {
        yield "function ";
      }
      yield* print(node.identifier);

      if (node.args?.length > 0) {
        yield " (";
        yield [...print(node.args)].join(", ");
        yield ")";
      }

      if (node.isFunction) {
        yield "\n";
      } else {
        yield " ===\n";
      }

      context.indent = 0;
      yield* print(node.content);
      context.indent = 0;

      return;
    }

    case "Stitch": {
      yield "\n";
      yield "= ";
      yield* print(node.identifier);
      yield "\n";

      context.indent = 0;
      yield* print(node.content);
      context.indent = 0;

      return;
    }

    case "Argument": {
      if (node.isByReference) {
        yield "ref ";
      }

      yield* print(node.identifier);

      return;
    }

    case "Weave": {
      yield* print(node.content);

      return;
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

        yield call;
      } else {
        yield "-> ";
        yield* print(node.target, context);
      }

      return;
    }

    case "TunnelOnwards": {
      return yield "->->";
    }

    case "Sequence": {
      yield "{";

      if (node.sequenceType === 2) {
        yield "&";
      }
      if (node.sequenceType === 4) {
        yield "~";
      }
      if (node.sequenceType === 8) {
        yield "!";
      }

      yield "|";

      yield [...print(node.sequenceElements)].join("|");

      yield "|}";

      return;
    }

    case "Path": {
      const path = [...print(node.components, context)];
      yield path.join(".");
      return;
    }
    case "Identifier": {
      return yield node.name;
    }
    case "Number": {
      return yield node.value + "";
    }
    case "String": {
      yield '"';
      yield node.toString();
      yield '"';
      return;
    }
    case "UnaryExpression": {
      yield node.opName || node.op;
      yield " ";
      yield* print(node.innerExpression);
      return;
    }
    case "BinaryExpression": {
      yield* print(node.leftExpression);
      yield " ";
      yield node.opName || node.op;
      yield " ";
      yield* print(node.rightExpression);
      return;
    }
    case "Glue": {
      return yield "<>";
    }

    case "LIST": {
      yield "LIST ";
      yield* print(node.variableIdentifier);
      yield " = ";
      yield* print(node.listDefinition);
      yield "\n";
      return;
    }

    case "ListDefinition": {
      return yield [...print(node.itemDefinitions)].join(", ");
    }

    case "ListElement": {
      if (node.inInitialList) {
        return yield ["(", ...print(node.indentifier), ")"].join("");
      } else {
        yield* print(node.indentifier);
      }
      return;
    }

    case "CONST": {
      yield "CONST ";
      yield* print(node.constantIdentifier);
      yield " = ";
      yield* print(node.expression);
      yield "\n";
      return;
    }

    case "VAR": {
      yield "VAR ";
      yield* print(node.variableIdentifier);
      yield " = ";
      yield* print(node.expression);
      yield "\n";
      return;
    }

    case "temp": {
      yield "~ temp ";
      yield* print(node.variableIdentifier);
      yield " = ";
      yield* print(node.expression);
      yield "\n";
      return;
    }

    case "variable assignment": {
      yield "~ ";
      yield* print(node.variableIdentifier);
      yield " = ";
      yield* print(node.expression);
      yield "\n";
      return;
    }

    case "IncDecExpression": {
      yield "~ ";
      yield* print(node.varIdentifier);
      yield node.expression
        ? [
            node.isInc ? " += " : " -= ",
            [...print(node.expression)].join(""),
          ].join("")
        : node.isInc
        ? "++"
        : "--";
      yield "\n";
      return;
    }

    case "ReturnType": {
      yield "~ return ";
      yield* print(node.returnedExpression);
      yield "\n";
      return;
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
  const ast = parser.StatementsAtLevel(StatementLevel.Top);

  const context = {};
  const out = [...render(ast, context)];

  if (halt) {
    logNode(halt, getKind(halt));
  }

  return out.reduce((acc, val) => {
    if (val.kind === "ResetIndent") {
      return acc.trimEnd() + "\n";
    } else {
      return acc + val;
    }
  }, "");
};
