const {
  builders: { group },
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

function groupLines(path, print) {
  const node = path.getValue();

  const lineGroups = node.reduce(
    (acc, val) => ({
      ...acc,
      [val._debugMetadata?.startLineNumber ?? 0]: [
        ...(acc[val._debugMetadata?.startLineNumber ?? 0] || []),
        val,
      ],
    }),
    {}
  );

  console.log({ lineGroups });

  return Object.values(lineGroups).map((lineGroup) =>
    group(lineGroup.map(print))
  );
}

let firstCall = true;
function printArray(path, options, print) {
  let isFirstCall = firstCall;
  firstCall = false;

  const node = path.getValue();

  const acc = [[]];
  let currentSourceLine = node[0]._debugMetadata?.startLineNumber ?? -1;
  for (const index in node) {
    const child = node[index];
    const childDoc = print(index);

    if (isFirstCall) {
      logNode({
        mine: child._debugMetadata?.startLineNumber ?? currentSourceLine,
        currentSourceLine,
      });
    }

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

  console.log({ acc });
  return acc.map((x) => group(x));
}

module.exports = {
  crunchTags,
  groupLines,
  printArray,
};
