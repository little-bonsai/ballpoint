const print = require("./print");

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

module.exports = {
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
