const {
  builders: { group, join, line },
} = require("prettier").doc;
const { getKind, logNode, tap, tapJSON } = require("./util");

function crunchTags(nodes) {
  let children = [...nodes];

  while (nodes.length > 0) {
    nodes.pop();
  }

  function* itterateIncludingContentList(nodes) {
    if (Array.isArray(nodes)) {
      for (const child of nodes) {
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
      nodes.at(-1).children.push(child);
    } else {
      nodes.push(child);
    }

    if (getKind(child) === "Tag") {
      inTag = child.isStart;
      child.children ||= [];
    }
  }
}

function groupRealLines(nodes, docs) {
  const acc = [[]];

  let currentSourceLine = nodes[0]._debugMetadata?.startLineNumber ?? -1;
  for (const index in nodes) {
    const child = nodes[index];
    const childDoc = docs[index];

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

  return acc.map((doc) => group(doc));
}

module.exports = {
  crunchTags,
  groupRealLines,
};
