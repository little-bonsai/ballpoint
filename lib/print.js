const lineColumn = require("line-column");
const {
  builders: {
    align,
    breakParent,
    dedent,
    dedentToRoot,
    group,
    hardline,
    indent,
    join,
    line,
    lineSuffix,
    lineSuffixBoundary,
    literalline,
    markAsRoot,
    softline,
    trim,
  },
} = require("prettier").doc;

const { getKind, logNode, tap, tapJSON } = require("./util");
const handlePrettierIgnore = require("./handlePrettierIgnore");

let errored = false;

function adoptChoiceChildren(fieldName, node) {
  let collector = node;
  collector.children = [];

  for (const child of node[fieldName]) {
    if (getKind(child) === "Choice") {
      collector = node;
    }

    if (getKind(child) === "Choice") {
      collector.children.push(child);
      collector = child;
      collector.children = [];
      continue;
    }

    if (getKind(child) === "Gather") {
      child.children = [];
      if (collector !== node) {
        collector = collector.parent || node;
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
}

const printers = {
  ContentList: () => "",
  Identifier: ({ node }) => node.name,
  Number: ({ node }) => node.value + "",
  Path: ({ path, print }) => join(".", path.map(print, "components")),
  PrettierIgnored: () => "",
  PrettierRoot: ({ print, path }) => path.map(print, "____ROOT"),
  String: ({ node }) => `"${node.toString()}"`,
  Text: ({ node: { text } }) => (text === "\n" ? "" : [softline, text]),
  ref: ({ print, path }) => join(".", path.map(print, "pathIdentifiers")),

  LineGroup: ({ path, print }) =>
    path.map((line) => group(print(line)), "children"),

  Tag: ({ path, print, node: { isStart } }) =>
    isStart ? group(["#", path.map(print, "children"), softline]) : "",

  FunctionCall: ({ node, print, path, options }) => {
    const wasInline = options.lbz.isInline;
    options.lbz.isInline ||= node.outputWhenComplete;

    const { isInline } = options.lbz;

    const doc = (() => {
      const callDoc = print(["content", 0]);

      if (isInline) {
        return group(["{", callDoc, "}"]);
      } else {
        return [hardline, group(["~ ", callDoc])];
      }
    })();

    options.lbz.isInline = wasInline;

    return doc;
  },

  Divert: ({ node, print, path }) => {
    if (node.isFunctionCall) {
      return [
        group([print("target"), "(", join(", ", path.map(print, "args")), ")"]),
      ];
    } else {
      return [softline, group(["-> ", print("target")])];
    }
  },

  Gather: ({ node, print, path }) =>
    dedent([
      hardline,
      group([
        new Array(node.indentationDepth).fill("  "),
        new Array(node.indentationDepth).fill("- ").join(""),
        node.identifier ? group(["(", print("identifier"), ") "]) : [],
        indent(path.map(print, "children")),
      ]),
    ]),

  Conditional: ({ node, print, path, options }) => {
    options.test = true;
    return [
      softline,
      indent(
        group([
          group(["{", print("initialCondition"), ":"]),
          path.map(print, "branches"),
          softline,
          "}",
        ])
      ),
    ];
  },

  ConditionalSingleBranch: ({ node, print, path }) => {
    if (node.isElse) {
      if (node.isInline) {
        return ["|", path.map(print, "content")];
      } else {
        return [
          hardline,
          dedent(group(["- else: ", path.map(print, "content")])),
        ];
      }
    }

    if (node.isTrueBranch) {
      if (node.isInline) {
        return path.map(print, "content");
      } else {
        return [hardline, path.map(print, "content")];
      }
    }

    if (node.matchingEquality) {
      return [
        hardline,
        group([
          "- ",
          path.map(print, ["content", 1]),
          ": ",
          path.map(print, ["content", 0]),
        ]),
      ];
    }
  },

  Knot: ({ print, path, node: { isFirstKnot } }) => {
    return dedentToRoot([
      hardline,
      group(["=== ", print("identifier"), " ==="]),
      path.map(print, "content"),
    ]);
  },

  Weave: ({ node, print, path }) => {
    adoptChoiceChildren("content", node);
    return path.map(print, "children");
  },

  Choice: ({ node, path, print }) => {
    return [
      breakParent,
      dedentToRoot([
        line,
        group([
          new Array(node.indentationDepth).fill("  "),
          new Array(node.indentationDepth)
            .fill(node.onceOnly ? "* " : "+ ")
            .join(""),

          node._condition
            ? getKind(node._condition) === "MultipleConditionExpression"
              ? print("_condition")
              : group(["{ ", print("_condition"), " } "])
            : [],

          node.identifier ? group(["(", print("identifier"), ") "]) : [],

          print("startContent"),
          node.choiceOnlyContent
            ? group(["[", print("choiceOnlyContent"), "]"])
            : [],

          print("innerContent"),
        ]),
      ]),

      //indent([softline, path.map(print, "children")]),
    ];
  },

  "variable assignment": ({ node, print, path }) => {
    if (
      node.variableIdentifier.name ===
      "__littleBonsaiPrettierInternalDoNotTouch_INCLUDE"
    ) {
      return dedentToRoot([
        hardline,
        `INCLUDE ${atob(node.expression.toString())}`,
      ]);
    }

    if (
      node.variableIdentifier.name ===
      "__littleBonsaiPrettierInternalDoNotTouch_Comment"
    ) {
      const commentString = atob(node.expression.toString());

      if (commentString.trim() === "prettier-ignore") {
        return handlePrettierIgnore(path, options);
      }

      return [
        hardline,
        lineSuffix(group([softline, `//${commentString}`])),
        lineSuffixBoundary,
      ];
    }

    if (
      node.variableIdentifier.name ===
      "__littleBonsaiPrettierInternalDoNotTouch_CommentMany"
    ) {
      return [hardline, group([softline, atob(node.expression.toString())])];
    }

    if (
      node.variableIdentifier.name ===
      "__littleBonsaiPrettierInternalDoNotTouch_BlankLine"
    ) {
      return hardline;
    }

    return [
      hardline,
      group(["~ ", print("variableIdentifier"), " = ", print("expression")]),
    ];
  },
};

module.exports = function print(path, options, print) {
  options.lbz ||= {};

  try {
    if (errored) {
      return "";
    }

    const node = path.getValue();

    if (!node) {
      return "";
    }

    if (Array.isArray(node)) {
      logNode("YOU SENT ME AN ARRAY FROM", path.getNode(1));
    }

    const printer = printers[getKind(node)];
    if (printer) {
      return printer({ node, path, options, print });
    } else {
      errored = true;

      logNode(node);
      console.error("stopped", JSON.stringify(getKind(node)));
      return "/* could not parse, check error output */";
    }
  } catch (e) {
    console.error(e);
    errored = true;

    logNode(node);
    console.error("stopped", JSON.stringify(getKind(node)));
    return "/* could not parse, check error output */";
  }
};
