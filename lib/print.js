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
const { crunchTags, groupRealLines } = require("./arrayUtils");

let errored = false;

function printContentGroup(fieldName, { node, path, print }) {
  crunchTags(node[fieldName]);

  const doc = path.map((groupedLine) => print(groupedLine), fieldName);

  logNode(doc);
  return groupRealLines(node.____ROOT, doc);
}

const printers = {
  Identifier: ({ node }) => node.name,
  PrettierIgnored: () => "",
  Text: ({ node: { text } }) => (text === "\n" ? "" : [softline, text]),
  ref: ({ print, path }) => join(".", path.map(print, "pathIdentifiers")),

  Tag: ({ path, print, node: { isStart } }) =>
    isStart ? group(["#", path.map(print, "children"), softline]) : "",

  ContentList: printContentGroup.bind(null, "content"),
  PrettierRoot: (x) => markAsRoot(printContentGroup("____ROOT", x)),

  Conditional: ({ node, print, path }) => {
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

  Knot: ({ print, path, node: { isFirstKnot } }) => {
    return dedentToRoot([
      hardline,
      group(["=== ", print("identifier"), " ==="]),
      path.map(print, "content"),
    ]);
  },

  Weave: ({ node, print, path }) => {
    let collector = node;
    collector.children = [];

    for (const child of node.content) {
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
          collector = collector.parent;
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

    return path.map(print, "children");
  },

  Choice: ({ node, path, print }) => [
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

    indent(path.map(print, "children")),
  ],

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
      group(["~ ", print("variableIdentifier"), " = ", print("expression")]),
    ];
  },
};

module.exports = function print(path, options, print) {
  try {
    if (errored) {
      return "";
    }

    const node = path.getValue();

    if (!node) {
      return "";
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
