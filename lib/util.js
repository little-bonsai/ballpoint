const util = require("util");
const {
  Identifier,
} = require("inkjs/compiler/Parser/ParsedHierarchy/Identifier");
const { Path } = require("inkjs/compiler/Parser/ParsedHierarchy/Path");
const { Argument } = require("inkjs/compiler/Parser/ParsedHierarchy/Argument");

exports.getKind = function getKind(node, silent) {
  try {
    return node.GetType();
  } catch (_) {
    if (node instanceof Identifier) {
      return "Identifier";
    }
    if (node instanceof Path) {
      return "Path";
    }
    if (node instanceof Argument) {
      return "Argument";
    }

    if (!silent) {
      console.error("unkind:", node);
    }
    return null;
  }
};

exports.logNode = function logNode(node, depth = 1) {
  console.error(util.inspect(node, { showHidden: false, depth, colors: true }));
};

exports.tap = function tap(x) {
  console.error(x);
  return x;
};
exports.tapJSON = function tapJSON(x) {
  console.error(JSON.stringify(x, null, 2));
  return x;
};
