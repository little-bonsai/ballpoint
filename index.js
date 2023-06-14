const { InkParser } = require("inkjs/compiler/Parser/InkParser");
const { StatementLevel } = require("inkjs/compiler/parser/StatementLevel");

const languages = [
  {
    name: "ink",
    parsers: ["ink"],
    extensions: ["ink"],
  },
];

function parse(text, parsers, options) {
  const parser = new InkParser(text);
  const ast = parser.StatementsAtLevel(StatementLevel.Top);
  return ast;
}

function locStart(node) {
  console.log("locStart");
  0;
}

const parsers = {
  ink: {
    parse,
    astFormat: "ink-ast",
    locStart,
  },
};

function preprocess(node, children) {
  if (Array.isArray(node)) {
    return node.map((x) => preprocess(x));
  }

  try {
    if (node.GetType() === "Knot") {
      return {
        kind: "Knot",
        identifier: node.identifier.toString(),
        content: node.content.map(preprocess),
      };
    }

    if (node.GetType() === "Weave") {
      //console.log(node.content);

      const content = node.content
        .reduce(
          ({ acc, isCollecting }, node) => {
            if (node.GetType() === "Choice") {
              return {
                acc: [[node, []], ...acc],
                isCollecting: true,
              };
            }

            if (node.GetType() === "Gather") {
              return {
                acc: [[node], ...acc],
                isCollecting: false,
              };
            }

            if (isCollecting) {
              const [[head, children], ...tail] = acc;
              return {
                acc: [[head, [...children, node]], ...tail],
                isCollecting,
              };
            }

            return {
              acc: [[node], ...acc],
              isCollecting,
            };
          },
          { acc: [], isCollecting: false }
        )
        .acc.reverse();

      return {
        kind: "Weave",
        content: content.map(([node, children]) => preprocess(node, children)),
      };
    }

    if (node.GetType() === "Text") {
      return {
        kind: "Text",
        text: node.text,
      };
    }

    if (node.GetType() === "Gather") {
      return {
        kind: "Gather",
        depth: node.indentationDepth,
      };
    }

    if (node.GetType() === "Divert") {
      return {
        kind: "Divert",
        to: node.target.toString(),
      };
    }

    if (node.GetType() === "Choice") {
      //console.log(node);
      return {
        kind: "Choice",
        depth: node.indentationDepth,
        onceOnly: node.onceOnly,
        children: (children || []).map(preprocess),
        startContent: node.startContent.content.map(preprocess),
        choiceOnlyContent: node.choiceOnlyContent
          ? node.choiceOnlyContent.content.map(preprocess)
          : null,
        innerContent: node.innerContent.content.map(preprocess),
      };
    }
  } catch (e) {
    console.error(e);
  }

  //console.log("preprocess", node);

  return node;
}

function print(path, options, print) {
  const {
    builders: {
      dedentToRoot,
      dedent,
      markAsRoot,
      group,
      indent,
      join,
      line,
      softline,
      hardline,
    },
  } = require("prettier").doc;

  const node = path.getValue();

  if (Array.isArray(node)) {
    return join(hardline, path.map(print));
  }

  switch (node.kind) {
    case "Knot": {
      return markAsRoot([
        `=== ${node.identifier} ===`,
        hardline,
        ...path.map(print, "content"),
        hardline,
      ]);
    }

    case "Weave": {
      console.log(JSON.stringify(node, null, 2));
      return path.map(print, "content");
    }

    case "Text": {
      if (node.text === "/n") {
        return hardline;
      } else {
        return node.text;
      }
    }

    case "Gather": {
      return [new Array(node.depth).fill("- "), hardline];
    }

    case "Divert": {
      return node.to;
    }

    case "Choice": {
      //console.log(node);

      //group([new Array(node.depth).fill(node.onceOnly ? "* " : "+ ")]),
      return indent([
        group([dedentToRoot(path.call(print, "startContent"))]),
        hardline,
        ...path.map(print, "children"),
      ]);
    }

    default:
      console.log("unprinted", node.kind, node);
      return "/* ... */";
  }
}

const printers = {
  "ink-ast": {
    print,
    //embed,
    preprocess,
    //insertPragma,
    //canAttachComment,
    //isBlockComment,
    //printComment,
    //getCommentChildNodes,
    //handleComments: {
    //ownLine,
    //endOfLine,
    //remaining,
    //},
  },
};

module.exports = {
  languages,
  parsers,
  printers,
  defaultOptions: {
    tabWidth: 2,
    useTabs: false,
  },
};
