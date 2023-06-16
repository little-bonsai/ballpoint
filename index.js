const util = require("util");
const path = require("path");
const {
  builders: {
    breakParent,
    dedentToRoot,
    dedent,
    lineSuffix,
    literalline,
    align,
    group,
    hardline,
    indent,
    join,
    line,
    markAsRoot,
    softline,
  },
} = require("prettier").doc;

const { InkParser } = require("inkjs/compiler/Parser/InkParser");
const { StatementLevel } = require("inkjs/compiler/parser/StatementLevel");
const {
  Identifier,
} = require("inkjs/compiler/Parser/ParsedHierarchy/Identifier");
const { Path } = require("inkjs/compiler/Parser/ParsedHierarchy/Path");
const { Argument } = require("inkjs/compiler/Parser/ParsedHierarchy/Argument");

const languages = [
  {
    name: "ink",
    parsers: ["ink"],
    extensions: [".ink", ".inkle"],
  },
];

function parse(text, parsers, options) {
  const fileHandler = {
    ResolveInkFilename: (filename) => filename,
    LoadInkFileContents: (filename) =>
      `~ __littleBonsaiInternal_INCLUDE = "${btoa(filename)}"`,
  };

  const parser = new InkParser(text, options.filepath, null, null, fileHandler);
  const ast = parser.StatementsAtLevel(StatementLevel.Top);
  const out = { ____ROOT: ast };

  return out;
}

function locStart(node) {
  console.error("locStart");
  0;
}

const parsers = {
  ink: {
    parse,
    astFormat: "ink-ast",
    locStart,

    preprocess: (source) => {
      const annotated = source
        .trim()
        .replace(/\n\n+/m, "\n\n")
        .replace(/\/\*[^(\/\*]*\*\//m, (multiLineComment) => {
          return `~ __littleBonsaiInternal_CommentMany = "${btoa(
            multiLineComment
          )}"`;
        })
        .split("\n")
        .map((line) => {
          if (line.trim() === "") {
            return "~ __littleBonsaiInternal_BlankLine = true";
          }

          if (line.trim().startsWith("//")) {
            return `~ __littleBonsaiInternal_Comment = "${btoa(
              line.trim().replace(/^\/\//, "").trim()
            )}"`;
          }

          return line;
        })
        .join("\n");

      return annotated;
    },
  },
};

function getKind(node) {
  try {
    return node.GetType();
  } catch (_) {
    if (node instanceof Identifier) {
      return "Identifier";
    }
    if (node instanceof Path) {
      return "Path";
    }
    if (node instanceof Argument) {
      return "Argument";
    }

    console.error("unkind:", node);
    return null;
  }
}

function logNode(node, depth = 1) {
  console.error(util.inspect(node, { showHidden: false, depth, colors: true }));
}

function tap(x) {
  console.error(x);
  return x;
}
function tapJSON(x) {
  console.error(JSON.stringify(x, null, 2));
  return x;
}

let errored = false;
function print(path, options, print) {
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
        let children = [...node];
        while (node.length > 0) {
          node.pop();
        }

        let inTag = false;
        for (child of children) {
          if (inTag) {
            node.at(-1).children.push(child);
          } else {
            node.push(child);
          }

          if (getKind(child) === "Tag") {
            inTag = child.isStart;
            child.children ||= [];
          }
        }

        return path.map(print);
      }
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
          return group(["#", path.map(print, "children"), line]);
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

        return indent(path.map(print, "children"));
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
        if (node.variableIdentifier.name === "__littleBonsaiInternal_INCLUDE") {
          return dedentToRoot([
            hardline,
            `INCLUDE ${atob(node.expression.toString())}`,
          ]);
        }

        if (node.variableIdentifier.name === "__littleBonsaiInternal_Comment") {
          return [
            hardline,
            lineSuffix(group([line, `//${atob(node.expression.toString())}`])),
          ];
        }

        if (
          node.variableIdentifier.name === "__littleBonsaiInternal_CommentMany"
        ) {
          return [
            hardline,
            group([softline, atob(node.expression.toString())]),
          ];
        }

        if (
          node.variableIdentifier.name === "__littleBonsaiInternal_BlankLine"
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
          softline,
        ];
      }

      case "CONST": {
        return group([
          hardline,
          "CONST ",
          node.constantIdentifier.name,
          " = ",
          print("expression"),
        ]);
      }

      case "VAR": {
        return group([
          hardline,
          "VAR ",
          node.variableIdentifier.name,
          " = ",
          print("expression"),
        ]);
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

      default:
        if (errored) {
          return "";
        } else {
          errored = true;

          logNode(node);
          console.error("stopped", JSON.stringify(getKind(node)));
          return "/* ... */";
        }
    }
  } catch (e) {
    console.error(e);
    errored = true;

    logNode(node);
    console.error("stopped", JSON.stringify(getKind(node)));
    return "/* ... */";
  }
}

const printers = {
  "ink-ast": {
    print,
    //embed,
    //preprocess,
    //insertPragma,
    //canAttachComment,
    //isBlockComment,
    //printComment,
    //getCommentChildNodes,
    //handleComments: {
    //ownLine,
    //endOfLine,
    //remaining,
    //},
  },
};

module.exports = {
  languages,
  parsers,
  printers,
  defaultOptions: {
    tabWidth: 2,
    useTabs: false,
    printWidth: 999,
  },
};
