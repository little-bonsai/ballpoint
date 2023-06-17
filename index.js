const util = require("util");
const path = require("path");
var lineColumn = require("line-column");
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

const { getKind, logNode, tap, tapJSON } = require("./util");
const print = require("./print");

const languages = [
  {
    name: "ink",
    parsers: ["ink"],
    extensions: [".ink", ".inkle"],
  },
];

const parsers = {
  ink: {
    parse,
    astFormat: "ink-ast",
    locStart,
    locEnd,

    preprocess: (source) => {
      const annotated = source
        .trim()
        .replace(/\n\n+/m, "\n\n")
        .replace(/\/\*[^(\/\*]*\*\//m, (multiLineComment) => {
          return `~ __littleBonsaiPrettierInternalDoNotTouch_CommentMany = "${btoa(
            multiLineComment
          )}"`;
        })
        .split("\n")
        .map((line) => {
          if (line.trim() === "") {
            return "~ __littleBonsaiPrettierInternalDoNotTouch_BlankLine = true";
          }

          if (line.trim().startsWith("//")) {
            return `~ __littleBonsaiPrettierInternalDoNotTouch_Comment = "${btoa(
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

function parse(text, parsers, options) {
  const comments = [];
  const singleLineCommentRegex = /\/\/.*[\n$]/gm;

  let match;

  const getLineColumn = lineColumn(text);
  while ((match = singleLineCommentRegex.exec(text + "\n")) !== null) {
    comments.push({
      isComment: true,
      isSingle: true,
      value: match[0].replace("//", "").trim(),
      start: {
        absolute: match.index,
        ...getLineColumn.fromIndex(match.index),
      },
      end: {
        absolute: singleLineCommentRegex.lastIndex,
        ...getLineColumn.fromIndex(singleLineCommentRegex.lastIndex - 2),
      },
    });
  }

  const fileHandler = {
    ResolveInkFilename: (filename) => filename,
    LoadInkFileContents: (filename) =>
      `~ __littleBonsaiPrettierInternalDoNotTouch_INCLUDE = "${btoa(filename)}"`,
  };

  const parser = new InkParser(text, options.filepath, null, null, fileHandler);
  const ast = parser.StatementsAtLevel(StatementLevel.Top);
  const out = { ____ROOT: ast };

  return out;
}

function locStart(node) {
  if (node.isComment) {
    return node.start.line;
  }

  if (Array.isArray(node)) {
    return tap(locStart(node[0]));
  }

  if (node._debugMetadata) {
    return node._debugMetadata.startLineNumber;
  }

  console.error("locStart", node);
  return 0;
}

function locEnd(node) {
  if (node.isComment) {
    return node.end.line;
  }

  if (Array.isArray(node)) {
    return tap(locStart(node.at(-1)));
  }

  if (node._debugMetadata) {
    return node._debugMetadata.endLineNumber;
  }

  console.error("locStart", node);
  return 0;
}

function getCommentChildNodes(node) {
  if (Array.isArray(node)) {
    return node;
  }

  if (node.____ROOT) {
    return node.____ROOT;
  }

  if (!getKind(node, true)) {
    return [];
  }

  console.log("getCommentChildNodes", node);

  return undefined;
}

function canAttachComment(node) {
  if (Array.isArray(node)) {
    return canAttachComment(node[0]);
  } else {
    return new Set(["Text"]).has(getKind(node, true));
  }
}
function isBlockComment(node) {
  console.error("isBlockComment");
  return true;
}
function printComment(node) {
  console.error("printComment", node);
  return "";
}

const printers = {
  "ink-ast": {
    print,
    //embed,
    //preprocess,
    //insertPragma,
    canAttachComment,
    isBlockComment,
    printComment,
    getCommentChildNodes,
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
