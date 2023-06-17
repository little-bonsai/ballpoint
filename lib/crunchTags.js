const { getKind, logNode, tap, tapJSON } = require("./util");

module.exports = function crunchTags(path) {
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
};
