const lineColumn = require("line-column");
const {
  builders: { group, hardline, line, lineSuffix, trim },
} = require("prettier").doc;

function getSourcePositionsForNode(node) {
  if (node._debugMetadata) {
    return node._debugMetadata;
  }

  if (Array.isArray(node)) {
    const { startLineNumber, startCharacterNumber } = getSourcePositionsForNode(
      node.at(0)
    );
    const { endLineNumber, endCharacterNumber } = getSourcePositionsForNode(
      node.at(-1)
    );
    return {
      startLineNumber,
      startCharacterNumber,
      endLineNumber,
      endCharacterNumber,
    };
  }

  if (node.content) {
    return getSourcePositionsForNode(node.content);
  }

  console.error("could not find position for", node);
}

function renderIgnoredSiblings(options, node) {
  const {
    startLineNumber,
    startCharacterNumber,
    endLineNumber,
    endCharacterNumber,
  } = getSourcePositionsForNode(node);

  if (!startCharacterNumber) {
    logNode(node);
  }

  const getLineColumn = lineColumn(options.originalText);

  const start = getLineColumn.toIndex(startLineNumber, startCharacterNumber);
  let end = getLineColumn.toIndex(endLineNumber, endCharacterNumber);
  if (end === -1) {
    end = options.originalText.length;
  }

  return [
    hardline,
    trim,
    removeLBZInternalDirectives(options.originalText.slice(start, end)),
  ];
}

function removeLBZInternalDirectives(string) {
  return string.replace(
    "~ __littleBonsaiPrettierInternalDoNotTouch_BlankLine = true",
    ""
  );
}

module.exports = function handlePrettierIgnore(path, options) {
  const node = path.getValue();
  const commentString = atob(node.expression.toString());
  const myIndex = path.getName();
  const parent = path.getNode(1);

  if (Array.isArray(parent)) {
    console.log("prettier-ignore not implented for arrays");
  } else {
    parent.content.forEach((child, i) => {
      if (i > myIndex) {
        child.prettierIgnored = true;
      }
    });
  }

  return [
    hardline,
    lineSuffix(group([line, `//${commentString}`])),
    renderIgnoredSiblings(options, parent.content.slice(myIndex + 1)),
  ];
};
