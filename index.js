const util = require("util");
const {
  builders: {
    dedentToRoot,
    dedent,
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

const languages = [
  {
    name: "ink",
    parsers: ["ink"],
    extensions: ["ink"],
  },
];

function parse(text, parsers, options) {
  const parser = new InkParser(text);
  const ast = parser.StatementsAtLevel(StatementLevel.Top);
  return { ____ROOT: ast };
}

function locStart(node) {
  console.log("locStart");
  0;
}

const parsers = {
  ink: {
    parse,
    astFormat: "ink-ast",
    locStart,

    preprocess: (source) => {
      const annotated = source
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
    console.log("unkind:", node);
    return null;
  }
}

function logNode(node, depth = 1) {
  console.log(util.inspect(node, { showHidden: false, depth, colors: true }));
}

let errored = false;
function print(path, options, print) {
  const node = path.getValue();

  if (!node) {
    return [];
  }

  if (node.____ROOT) {
    return markAsRoot(print("____ROOT"));
  }
  if (Array.isArray(node)) {
    return path.map(print);
  }

  switch (getKind(node)) {
    case "AuthorWarning": {
      return [hardline, group(["TODO: ", node.warningMessage])];
    }
    case "ContentList": {
      return path.map(print, "content");
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
    case "Divert": {
      return group([line, "-> ", print("target")]);
    }
    case "Path": {
      return join(".", path.map(print, "components"));
    }

    case "Conditional": {
      return group([
        softline,
        "{",
        indent([
          group([line, print("initialCondition"), ":"]),
          path.map(print, "branches"),
        ]),
        softline,
        "}",
      ]);
    }

    case "ConditionalSingleBranch": {
      if (node.isTrueBranch) {
        if (node.isInline) {
          return print("content");
        } else {
          return [line, group([line, print("content")])];
        }
      }

      if (node.isElse) {
        if (node.isInline) {
          return ["|", print("content")];
        } else {
          return dedent([
            line,
            group([softline, " - else: ", print("content")]),
          ]);
        }
      }
    }

    case "Knot": {
      return dedentToRoot([
        line,
        group(["=== ", print("identifier"), " ===", line]),
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
          path.map(print, "children"),
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

    case "Text": {
      if (node.text === "\n") {
        return [];
      } else {
        return [softline, node.text];
      }
    }

    case "variable assignment": {
      if (node.variableIdentifier.name === "__littleBonsaiInternal_Comment") {
        return [group(["// ", atob(node.expression.toString())]), hardline];
      }

      if (node.variableIdentifier.name === "__littleBonsaiInternal_BlankLine") {
        return hardline;
      }
    }

    case "CONST": {
      return [
        group([
          "CONST ",
          node.constantIdentifier.name,
          " = ",
          print("expression"),
        ]),
        hardline,
      ];
    }

    case "VAR": {
      return [
        group([
          "VAR ",
          node.variableIdentifier.name,
          " = ",
          print("expression"),
        ]),
        hardline,
      ];
    }

    default:
      if (errored) {
        return "";
      } else {
        errored = true;

        logNode(node);
        console.log("stopped", JSON.stringify(getKind(node)));
        return "/* ... */";
      }
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
  },
};
