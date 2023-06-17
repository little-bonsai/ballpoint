const lineColumn = require("line-column");
const {
  builders: {
    align,
    breakParent,
    dedent,
    dedentToRoot,
    group,
    hardline,
    indent,
    join,
    line,
    lineSuffix,
    lineSuffixBoundary,
    literalline,
    markAsRoot,
    softline,
    trim,
  },
} = require("prettier").doc;

const { getKind, logNode, tap, tapJSON } = require("./util");
const handlePrettierIgnore = require("./handlePrettierIgnore");
const { printArray } = require("./arrayUtils");

let errored = false;

function oldPrint(path, options, print) {
  options.lbz ||= {};

  try {
    if (errored) {
      return "";
    }

    const node = path.getValue();

    if (!node) {
      return "";
    }

    if (node.____ROOT) {
      return markAsRoot(print("____ROOT"));
    }

    if (Array.isArray(node)) {
      return printArray(path, options, print);
    }

    if (node.prettierIgnored) {
      return "";
    }

    switch (getKind(node)) {
      case "AuthorWarning": {
        return [hardline, group(["TODO: ", node.warningMessage])];
      }
      case "ContentList": {
        return print("content");
      }
      case "Number": {
        return node.value + "";
      }
      case "String": {
        return `"${node.toString()}"`;
      }
      case "ref": {
        return join(".", print("pathIdentifiers"));
      }
      case "Identifier": {
      }
      case "FunctionCall": {
        const isRootCall = getKind(node.parent) === "ContentList";
        const wasInline = options.lbz.inline;
        const isInline = node.outputWhenComplete | options.lbz.inline;

        if (isRootCall) {
          if (isInline) {
            options.lbz.inline = true;
            const childDoc = group(["{", print("content", 0, "target"), "}"]);
            options.lbz.inline = wasInline;
            return childDoc;
          } else {
            return [
              hardline,
              breakParent,
              group(["~ ", print("content", 0, "target")]),
            ];
          }
        } else {
          return print("content", 0, "target");
        }
      }
      case "TunnelOnwards": {
        return group([line, "->->"]);
      }
      case "Path": {
        return join(".", path.map(print, "components"));
      }
      case "Glue": {
        return "<>";
      }
      case "Sequence": {
        return group(["{|", print("content"), "|}"]);
      }
      case "ParsedObject": {
        return print("includedStory");
      }
      case "Story": {
        return print("content");
      }

      case "Tag": {
        if (node.isStart) {
        } else {
          return "";
        }
      }

      case "Divert": {
        if (node.isFunctionCall) {
          return [
            group([print("target"), "(", join(", ", print("args")), ")"]),
          ];
        } else {
          return [softline, group(["-> ", print("target")])];
        }
      }

      case "Text": {
        if (node.text === "\n") {
          return "";
        } else {
          return [softline, node.text];
        }
      }

      case "Conditional": {
        return [
          softline,
          indent(
            group([
              group(["{", print("initialCondition"), ":"]),
              path.map(print, "branches"),
              softline,
              "}",
            ])
          ),
        ];
      }

      case "ConditionalSingleBranch": {
        if (node.isElse) {
          if (node.isInline) {
            return ["|", print("content")];
          } else {
            return [hardline, dedent(group(["- else: ", print("content")]))];
          }
        }

        if (node.isTrueBranch) {
          if (node.isInline) {
            return print("content");
          } else {
            return [hardline, print("content")];
          }
        }

        if (node.matchingEquality) {
          return [
            hardline,
            group(["- ", print(["content", 1]), ": ", print(["content", 0])]),
          ];
        }
      }

      case "Function": {
        return dedentToRoot([
          line,
          group([
            "=== function ",
            print("identifier"),
            node.args ? ["(", join(", ", print("args")), ")"] : [],
          ]),
          print("content"),
        ]);
      }

      case "Argument": {
        return [node.isByReference ? "ref " : [], print("identifier")];
      }

      case "IncDecExpression": {
        return [
          hardline,
          group([
            "~ ",
            print("varIdentifier"),
            node.expression
              ? [node.isInc ? " += " : " -= ", print("expression")]
              : node.isInc
              ? "++"
              : "--",
          ]),
        ];
      }

      case "UnaryExpression": {
        return [node.opName || node.op, " ", print("innerExpression")];
      }

      case "BinaryExpression": {
        return [
          print("leftExpression"),
          " ",
          node.opName,
          " ",
          print("rightExpression"),
        ];
      }

      case "Stitch": {
        return dedentToRoot([
          line,
          group(["= ", print("identifier"), hardline]),
          print("content"),
        ]);
      }

      case "ReturnType": {
        return group(["~ return ", print("returnedExpression")]);
      }

      case "Gather": {
        return dedent([
          hardline,
          group([
            new Array(node.indentationDepth).fill("  "),
            new Array(node.indentationDepth).fill("- ").join(""),
            node.identifier ? group(["(", print("identifier"), ") "]) : [],
            indent(path.map(print, "children")),
          ]),
        ]);
      }

      case "Choice": {
        return [
          breakParent,
          dedentToRoot([
            line,
            group([
              new Array(node.indentationDepth).fill("  "),
              new Array(node.indentationDepth)
                .fill(node.onceOnly ? "* " : "+ ")
                .join(""),

              node._condition
                ? getKind(node._condition) === "MultipleConditionExpression"
                  ? print("_condition")
                  : group(["{ ", print("_condition"), " } "])
                : [],

              node.identifier ? group(["(", print("identifier"), ") "]) : [],

              print("startContent"),
              node.choiceOnlyContent
                ? group(["[", print("choiceOnlyContent"), "]"])
                : [],

              print("innerContent"),
            ]),
          ]),

          indent(path.map(print, "children")),
        ];
      }

      case "MultipleConditionExpression": {
        return path.map(
          (child) => group(["{ ", print(child), " } "]),
          "content"
        );
      }

      case "CONST": {
        return [
          hardline,
          group([
            "CONST ",
            node.constantIdentifier.name,
            " = ",
            print("expression"),
          ]),
        ];
      }

      case "VAR": {
        return [
          hardline,
          group([
            "VAR ",
            node.variableIdentifier.name,
            " = ",
            print("expression"),
          ]),
        ];
      }

      case "LIST": {
        return [
          hardline,
          group([
            "LIST ",
            print("variableIdentifier"),
            " = ",
            print("listDefinition"),
          ]),
        ];
      }

      case "ListDefinition": {
        return join(", ", path.map(print, "itemDefinitions"));
      }

      case "ListElement": {
        if (node.inInitialList) {
          return group(["(", print("indentifier"), ")"]);
        } else {
          return print("indentifier");
        }
      }

      case "temp": {
        return group([
          line,
          "~ temp ",
          node.variableIdentifier.name,
          " = ",
          print("expression"),
          softline,
        ]);
      }

      default: {
        if (errored) {
          return "";
        } else {
          errored = true;

          logNode(node);
          console.error("stopped", JSON.stringify(getKind(node)));
          return "/* could not parse, check error output */";
        }
      }
    }
  } catch (e) {
    console.error(e);
    errored = true;

    logNode(node);
    console.error("stopped", JSON.stringify(getKind(node)));
    return "/* could not parse, check error output */";
  }
}
