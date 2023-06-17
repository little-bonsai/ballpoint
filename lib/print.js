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
    literalline,
    markAsRoot,
    softline,
    trim,
  },
} = require("prettier").doc;

const { getKind, logNode, tap, tapJSON } = require("./util");
const handlePrettierIgnore = require("./handlePrettierIgnore");
const crunchTags = require("./crunchTags");

let errored = false;
module.exports = function print(path, options, print) {
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
      if (node.length === 0) {
        return [];
      } else {
        crunchTags(path);
        return path.map(print);
      }
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
        return node.name;
      }
      case "FunctionCall": {
        return [print("content", 0, "target"), hardline];
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
          return group(["#", path.map(print, "children"), softline]);
        } else {
          return "";
        }
      }

      case "Divert": {
        if (node.isFunctionCall) {
          return group([
            hardline,
            "~ ",
            print("target"),
            "(",
            join(", ", print("args")),
            ")",
          ]);
        } else {
          return group([softline, "-> ", print("target")]);
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
        if (node.isTrueBranch) {
          if (node.isInline) {
            return print("content");
          } else {
            return group([breakParent, print("content")]);
          }
        }

        if (node.isElse) {
          if (node.isInline) {
            return ["|", print("content")];
          } else {
            return dedent([hardline, group([" - else: ", print("content")])]);
          }
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

      case "Knot": {
        return dedentToRoot([
          line,
          group(["=== ", print("identifier"), " ==="]),
          print("content"),
        ]);
      }

      case "Stitch": {
        return dedentToRoot([
          line,
          group(["= ", print("identifier"), hardline]),
          print("content"),
        ]);
      }

      case "Weave": {
        let collector = node;
        collector.children = [];

        for (const child of node.content) {
          if (getKind(child) === "Choice") {
            collector = node;
          }

          if (getKind(child) === "Choice") {
            collector.children.push(child);
            collector = child;
            collector.children = [];
            continue;
          }

          if (getKind(child) === "Gather") {
            child.children = [];
            if (collector !== node) {
              collector = collector.parent;
            }
          }

          if (
            collector.children.at(-1) &&
            getKind(collector.children.at(-1)) === "Gather" &&
            collector.children.at(-1).children.length === 0
          ) {
            collector.children.at(-1).children.push(child);
          } else {
            collector.children.push(child);
          }
        }

        return indent(print("children"));
      }

      case "Gather": {
        return dedentToRoot([
          line,
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
          dedentToRoot([
            line,
            group([
              new Array(node.indentationDepth).fill("  "),
              new Array(node.indentationDepth)
                .fill(node.onceOnly ? "* " : "+ ")
                .join(""),

              node._condition ? group(["{ ", print("_condition"), " } "]) : [],

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

      case "variable assignment": {
        if (
          node.variableIdentifier.name ===
          "__littleBonsaiPrettierInternalDoNotTouch_INCLUDE"
        ) {
          return dedentToRoot([
            hardline,
            `INCLUDE ${atob(node.expression.toString())}`,
          ]);
        }

        if (
          node.variableIdentifier.name ===
          "__littleBonsaiPrettierInternalDoNotTouch_Comment"
        ) {
          const commentString = atob(node.expression.toString());

          if (commentString.trim() === "prettier-ignore") {
            return handlePrettierIgnore(path, options);
          }

          return [
            hardline,
            lineSuffix(group([softline, `//${commentString}`])),
          ];
        }

        if (
          node.variableIdentifier.name ===
          "__littleBonsaiPrettierInternalDoNotTouch_CommentMany"
        ) {
          return [
            hardline,
            group([softline, atob(node.expression.toString())]),
          ];
        }

        if (
          node.variableIdentifier.name ===
          "__littleBonsaiPrettierInternalDoNotTouch_BlankLine"
        ) {
          return hardline;
        }

        return [
          softline,
          group([
            "~ ",
            print("variableIdentifier"),
            " = ",
            print("expression"),
          ]),
        ];
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
        return join(", ", print("itemDefinitions"));
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
          return "/* ... */";
        }
      }
    }
  } catch (e) {
    console.error(e);
    errored = true;

    logNode(node);
    console.error("stopped", JSON.stringify(getKind(node)));
    return "/* ... */";
  }
};
