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

function doInline(options, fn) {
  const wasInline = options.lbz.isInline;
  options.lbz.isInline = true;
  const output = fn();
  options.lbz.isInline = wasInline;
  return output;
}

const printers = {
  Identifier: ({ node }) => node.name,
  Number: ({ node }) => node.value + "",
  Path: ({ path, print }) => join(".", path.map(print, "components")),
  PrettierIgnored: () => "",
  String: ({ node }) => `"${node.toString()}"`,
  ref: ({ print, path }) => join(".", path.map(print, "pathIdentifiers")),
  ReturnType: ({ print }) => group(["~ return ", print("returnedExpression")]),

  IncDecExpression: ({ node, print }) => [
    hardline,
    group([
      "~ ",
      print("varIdentifier"),
      node.expression
        ? [node.isInc ? " += " : " -= ", print("expression")]
        : node.isInc
        ? "++"
        : "--",
    ]),
  ],

  UnaryExpression: ({ node, print }) => [
    node.opName || node.op,
    " ",
    print("innerExpression"),
  ],

  BinaryExpression: ({ print, node }) => [
    print("leftExpression"),
    " ",
    node.opName,
    " ",
    print("rightExpression"),
  ],

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

  LIST: ({ print, path }) => [
    hardline,
    group([
      "LIST ",
      print("variableIdentifier"),
      " = ",
      join(", ", path.map(print, "listDefinition", "content")),
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

  FunctionCall: ({ node, print, options }) => {
    const isTopLevel = node.outputWhenComplete || node.shouldPopReturnedValue;

    if (isTopLevel) {
      const isInline = node.outputWhenComplete;
      if (isInline) {
        return doInline(options, () =>
          group(["{", print(["content", 0]), "}"])
        );
      } else {
        return doInline(options, () => [
          hardline,
          group(["~ ", print(["content", 0])]),
        ]);
      }
    } else {
      return print(["content", 0]);
    }
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

  "variable assignment": ({ node, print, path, options }) => {
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
      return [trim, literalline];
    }

    return [
      hardline,
      group(["~ ", print("variableIdentifier"), " = ", print("expression")]),
    ];
  },

  MultipleConditionExpression: ({ node, path, print }) =>
    path.map((child) => group(["{ ", print(child), " } "]), "content"),

  Conditional: ({ node, print, path, options }) => {
    return [
      softline,
      indent(
        group([
          group(["{", print("initialCondition"), ":"]),
          softline,
          join(softline, path.map(print, "branches")),
          "}",
        ])
      ),
    ];
  },

  ConditionalSingleBranch: ({ node, print, path, options }) => {
    if (node.isElse) {
      if (node.isInline) {
        return doInline(options, () => ["|", path.map(print, "content")]);
      } else {
        return [
          breakParent,
          dedent(group(["- else: ", path.map(print, "content")])),
        ];
      }
    }

    if (node.isTrueBranch) {
      if (node.isInline) {
        return doInline(options, () => path.map(print, "content"));
      } else {
        return [path.map(print, "content")];
      }
    }

    if (node.matchingEquality) {
      return [
        breakParent,
        group(["- ", print(["content", 1]), ": ", print(["content", 0])]),
      ];
    }

    return "";
  },

  PrettierRoot: ({ print, path }) =>
    markAsRoot(group(join(line, path.map(print, "____ROOT")))),
  LineGroup: ({ print, path }) => group(path.map(print, "children")),

  Tag: ({ node: { isStart } }) => (isStart ? "#" : ""),

  //Text: ({ node: { text } }) => (text === "\n" ? hardline : text),
  Text: ({ node: { text } }) => (text === "\n" ? [] : [softline, text]),
  //Text: ({ node: { text } }) => (text === "\n" ? [] : text),

  ContentList: ({ path, print }) => {
    return group(path.map(print, "content"));
  },

  Gather: ({ node, print }) => {
    return dedent([
      hardline,
      dedent(
        group([
          new Array(node.indentationDepth).fill("  "),
          new Array(node.indentationDepth).fill("- ").join(""),
          node.identifier ? group(["(", print("identifier"), ") "]) : [],
          print("child"),
        ])
      ),
    ]);
  },

  Stitch: ({ print, path }) => {
    return dedentToRoot([
      group(["= ", print("identifier")]),
      path.map(print, "content"),
    ]);
  },

  Knot: ({ print, path }) => {
    return dedentToRoot([
      hardline,
      group(["=== ", print("identifier"), " ==="]),
      path.map(print, "content"),
    ]);
  },

  Weave: ({ print, path, node }) => {
    //logNode(node);
    return [
      getKind(path.getNode(1)) === "Knot" ||
      getKind(path.getNode(1)) === "Stitch"
        ? hardline
        : [],
      group(path.map(print, "content")),
    ];
  },

  Choice: ({ node, path, print }) => {
    const isWeird =
      node.innerContent.content[0].text !== "\n" || node.choiceOnlyContent;

    function printChoiceMain() {
      return dedentToRoot(
        group([
          //new Array(node.indentationDepth).fill("  "),
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
          isWeird
            ? [
                group(["[", print("choiceOnlyContent"), "]"]),
                node.innerContent
                  ? path.map(print, "innerContent", "content")
                  : "",
              ]
            : [],
        ])
      );
    }

    return [
      hardline,
      dedentToRoot(printChoiceMain()),
      indent(breakParent),
      indent(group([breakParent, path.map((x) => print(x), "children")])),
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
