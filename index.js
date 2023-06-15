const util = require("util");
const {
  builders: {
    dedent,
    dedentToRoot,
    literalline,

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
  return ast;
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

  if (Array.isArray(node)) {
    return path.map(print);
  }

  if (node === null) {
    return [];
  }

  switch (getKind(node)) {
    case "AuthorWarning": {
      return [group(["TODO: ", node.warningMessage]), hardline];
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
          if (collector !== node) {
            collector = collector.parent;
          }
        }

        collector.children.push(child);
      }

      return indent(path.map(print, "children"));
    }
    case "Divert": {
      return group(["-> ", print("target")]);
    }
    case "Path": {
      return join(".", path.map(print, "components"));
    }

    case "Knot": {
      return [
        group(["=== ", print("identifier"), " ==="]),
        [hardline, print("content")],
      ];
    }

    case "Conditional": {
      return [
        "{",
        indent([
          group([print("initialCondition"), ":"]),
          path.map(print, "branches"),
        ]),
        "}",
      ];
    }

    case "Gather": {
      return [line, new Array(node.indentationDepth).fill("- ").join("")];
    }

    case "Choice": {
      return [
        line,
        group([
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

        group([line, [...path.map(print, "children")]]),
      ];
    }

    case "ConditionalSingleBranch": {
      if (node.isTrueBranch) {
        if (node.isInline) {
          return print("content");
        } else {
          return [line, print("content"), line];
        }
      }

      if (node.isElse) {
        if (node.isInline) {
          return ["|", print("content")];
        } else {
          return ["- else: ", print("content"), hardline];
        }
      }
    }

    case "Text": {
      if (node.text === "\n") {
        return [];
      } else {
        return node.text;
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
