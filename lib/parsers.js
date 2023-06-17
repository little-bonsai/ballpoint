const { InkParser } = require("inkjs/compiler/Parser/InkParser");
const { StatementLevel } = require("inkjs/compiler/parser/StatementLevel");
var lineColumn = require("line-column");

const { getKind, logNode, tap, tapJSON } = require("./util");

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

function preprocess(source) {
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
}

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
      `~ __littleBonsaiPrettierInternalDoNotTouch_INCLUDE = "${btoa(
        filename
      )}"`,
  };

  const parser = new InkParser(text, options.filepath, null, null, fileHandler);
  const ast = parser.StatementsAtLevel(StatementLevel.Top);
  const out = { ____ROOT: ast };

  return out;
}

module.exports = {
  ink: {
    parse,
    astFormat: "ink-ast",
    locStart,
    locEnd,

    preprocess,
  },
};
