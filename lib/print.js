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

const printers = {
  ContentList: ({ path, print }) => group(path.map(print, "content")),
  Identifier: ({ node }) => node.name,
  Number: ({ node }) => node.value + "",
  Path: ({ path, print }) => join(".", path.map(print, "components")),
  PrettierIgnored: () => "",
  PrettierRoot: ({ print, path }) => path.map(print, "____ROOT"),
  String: ({ node }) => `"${node.toString()}"`,
  Text: ({ node: { text } }) => (text === "\n" ? "" : [softline, text]),
  ref: ({ print, path }) => join(".", path.map(print, "pathIdentifiers")),
  Tag: ({ node: { isStart } }) => (isStart ? "#" : ""),
  ListDefinition: ({ path, print }) =>
    join(", ", path.map(print, "itemDefinitions")),

  VAR: ({ node, print }) => [
    hardline,
    group(["VAR ", node.variableIdentifier.name, " = ", print("expression")]),
  ],

  CONST: ({ node, print }) => [
    hardline,
    group(["CONST ", node.constantIdentifier.name, " = ", print("expression")]),
  ],

  LIST: ({ print }) => [
    hardline,
    group([
      "LIST ",
      print("variableIdentifier"),
      " = ",
      join(", ", print("listDefinition")),
    ]),
  ],

  ListElement: ({ node, print }) => {
    if (node.inInitialList) {
      return group(["(", print("indentifier"), ")"]);
    } else {
      return print("indentifier");
    }
  },

  AuthorWarning: ({ node }) => [
    hardline,
    group(["TODO: ", node.warningMessage]),
  ],

  LineGroup: ({ path, print, options }) => [
    options.lbz.isInline ? [] : hardline,
    path.map((line) => group(print(line)), "children"),
  ],

  FunctionCall: ({ node, print, path, options }) => {
    const wasInline = options.lbz.isInline;
    options.lbz.isInline ||= node.outputWhenComplete;
    const isTopLevel = node.outputWhenComplete;

    const { isInline } = options.lbz;

    const doc = (() => {
      const callDoc = print(["content", 0]);

      if (isInline) {
        if (isTopLevel) {
          return group(["{", callDoc, "}"]);
        } else {
          return callDoc;
        }
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
    dedent(
      group([
        new Array(node.indentationDepth).fill("  "),
        new Array(node.indentationDepth).fill("- ").join(""),
        node.identifier ? group(["(", print("identifier"), ") "]) : [],
        //indent(path.map(print, "children")),
      ])
    ),

  Conditional: ({ node, print, path, options }) => {
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

  ConditionalSingleBranch: ({ node, print, path, options }) => {
    if (node.isElse) {
      if (node.isInline) {
        const wasInline = options.lbz.isInline;
        options.lbz.isInline = true;
        const doc = ["|", path.map(print, "content")];
        options.lbz.isInline = wasInline;
        return doc;
      } else {
        return [
          hardline,
          dedent(group(["- else: ", path.map(print, "content")])),
        ];
      }
    }

    if (node.isTrueBranch) {
      if (node.isInline) {
        const wasInline = options.lbz.isInline;
        options.lbz.isInline = true;
        const doc = path.map(print, "content");
        options.lbz.isInline = wasInline;
        return doc;
      } else {
        return [hardline, path.map(print, "content")];
      }
    }

    if (node.matchingEquality) {
      return [
        hardline,
        group(["- ", print(["content", 1]), ": ", print(["content", 0])]),
      ];
    }

    return "";
  },

  Knot: ({ print, path, node: { isFirstKnot } }) => {
    return dedentToRoot([
      hardline,
      group(["=== ", print("identifier"), " ==="]),
      path.map(print, "content"),
    ]);
  },

  Weave: ({ node, print, path }) => {
    return path.map(print, "content");
  },

  Choice: ({ node, path, print }) => {
    return [
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

          node.startContent ? path.map(print, "startContent", "content") : "",
          node.choiceOnlyContent
            ? group(["[", print("choiceOnlyContent"), "]"])
            : [],
          node.innerContent ? path.map(print, "innerContent", "content") : "",
        ]),
      ]),
      indent([path.map(print, "children")]),
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
