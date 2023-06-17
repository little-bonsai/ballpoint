const {
  builders: { group, join, line },
} = require("prettier").doc;
const { getKind, logNode, tap, tapJSON } = require("./util");

function crunchTags(path) {
  const node = path.getValue();

  let children = [...node];

  while (node.length > 0) {
    node.pop();
  }

  function* itterateIncludingContentList(node) {
    if (Array.isArray(node)) {
      for (const child of node) {
        if (getKind(child) === "ContentList") {
          yield* itterateIncludingContentList(child.content);
        } else {
          yield child;
        }
      }
    }
  }

  let inTag = false;
  for (child of itterateIncludingContentList(children)) {
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
}

//groups together AST nodes that appeared in the same line of the source file
function printArray(path, options, print) {
  crunchTags(path);

  const node = path.getValue();

  const acc = [[]];
  let currentSourceLine = node[0]._debugMetadata?.startLineNumber ?? -1;
  for (const index in node) {
    const child = node[index];
    const childDoc = print(index);

    if (
      (child._debugMetadata?.startLineNumber ?? currentSourceLine) ===
      currentSourceLine
    ) {
      acc.at(-1).push(childDoc);
    } else {
      acc.push([childDoc]);
      currentSourceLine = child._debugMetadata?.startLineNumber;
    }
  }

  return acc.map((x) => group(x));
}

module.exports = {
  crunchTags,
  printArray,
};
