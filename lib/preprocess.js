const { getKind, logNode, tap, tapJSON } = require("./util");

function pipe(...fns) {
  return (data) => fns.reduce((data, fn) => fn(data), data);
}

function makePreprocesser(id, visitorFns) {
  return function preProcessor(node, path = []) {
    if (!node) {
      return node;
    }

    if (node.hasBeenVisited?.[id]) {
      return node;
    }

    const visitor = visitorFns[getKind(node, true)];
    const visited = visitor ? visitor(node, path) : node;

    if (Array.isArray(node)) {
      return visited.forEach((child) => preProcessor(child, [...path, node]));
    }

    node.hasBeenVisited ||= {};
    node.hasBeenVisited[id] = true;

    Object.entries(node).forEach(([key, child]) => {
      if (key === "parent") {
        return;
      }
      if (key === "hasBeenVisited") {
        return;
      }

      if (typeof child !== "object") {
        return;
      }

      if (!child) {
        return;
      }

      preProcessor(child, [...path, node]);
    });

    return visited;
  };
}

const removeContentLists = makePreprocesser("removeContentLists", {
  Array: (xs) => {
    for (const i in xs) {
      if (getKind(xs[i]) === "ContentList") {
        xs.splice(i, 1, ...xs[i].content);
      }
    }

    return xs;
  },
});

const chunkTags = makePreprocesser("chunkTags", {
  Array: (nodes) => {
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

    return nodes;
  },
});

const groupRealLines = makePreprocesser("groupRealLines", {
  Array: (nodes, path) => {
    if (nodes.length === 0) {
      return nodes;
    }

    if (path.some((node) => getKind(node) === "LineGroup")) {
      return nodes;
    }

    function getStartLine(node) {
      return node?._debugMetadata?.startLineNumber ?? -1;
    }
    function getEndLine(node) {
      return node?._debugMetadata?.endLineNumber ?? -1;
    }

    const first = nodes[0];
    nodes[0] = [first];

    let iRead = 1;
    let iWrite = 0;
    while (iRead < nodes.length) {
      const node = nodes[iRead];
      const currentBuffer = nodes[iWrite];
      if (getEndLine(node) === getStartLine(currentBuffer[0])) {
        currentBuffer.push(node);
      } else {
        iWrite++;
        nodes[iWrite] = [node];
      }
      iRead++;
    }

    nodes.splice(iWrite + 1, Infinity);

    for (const i in nodes) {
      const chunk = nodes[i];
      if (nodes[i].length === 1) {
        nodes[i] = chunk[0];
      } else {
        nodes[i] = {
          kind: "LineGroup",
          children: chunk,
        };
      }
    }

    return nodes;
  },
});

function fosterChoicesOld(nodes) {}

const fosterChoices = makePreprocesser("fosterChoices", {
  Array: (nodes) => {
    const children = [];
    const root = { children };
    let collector = root;

    for (const child of nodes) {
      if (getKind(child) === "Choice") {
        collector.children.push(child);
        collector = child;
        collector.children = [];
        continue;
      }

      if (getKind(child) === "Gather") {
        child.children = [];
        if (collector !== root) {
          collector = collector.parent || root;
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

    nodes.splice(0, Infinity, ...root.children);

    return nodes;
  },
});

module.exports = function preprocess(node, options) {
  const processed = pipe(
    removeContentLists,
    chunkTags,
    fosterChoices,
    groupRealLines
  )(node);

  logNode(processed);

  return processed;
};
