const util = require("util");
const {
  Identifier,
} = require("inkjs/compiler/Parser/ParsedHierarchy/Identifier");
const { Path } = require("inkjs/compiler/Parser/ParsedHierarchy/Path");
const { Argument } = require("inkjs/compiler/Parser/ParsedHierarchy/Argument");
const {
  VariableAssignment,
} = require("inkjs/compiler/Parser/ParsedHierarchy/Variable/VariableAssignment");

exports.getKind = function getKind(node, silent) {
  if (!node) {
    return "Null";
  }

  if (Array.isArray(node)) {
    return "Array";
  }

  if (node.prettierIgnored) {
    return "PrettierIgnored";
  }
  if (node.alreadyDone) {
    return "AlreadyDone";
  }

  if (node.____ROOT) {
    return "PrettierRoot";
  }

  if ("kind" in node) {
    return node.kind;
  }

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
    if (node instanceof VariableAssignment) {
      return "VariableAssignment";
    }

    if (!silent) {
      console.error("unkind:", node);
    }
    return null;
  }
};

exports.logNode = function logNode(...xs) {
  console.error(
    ...xs.map((x) =>
      util.inspect(x, { showHidden: false, depth: 1, colors: true })
    )
  );
};

exports.tap = function tap(x) {
  console.error(x);
  return x;
};
exports.tapJSON = function tapJSON(x) {
  console.error(JSON.stringify(x, null, 2));
  return x;
};
