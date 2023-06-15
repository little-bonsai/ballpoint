const { readFile, writeFile } = require("fs/promises");
const util = require("util");

const { InkParser } = require("inkjs/compiler/Parser/InkParser");
const { StatementLevel } = require("inkjs/compiler/Parser/StatementLevel");
const {
  Identifier,
} = require("inkjs/compiler/Parser/ParsedHierarchy/Identifier");

function parse(text) {
  const parser = new InkParser(text);
  const ast = parser.StatementsAtLevel(StatementLevel.Top);
  return ast;
}

function* printDelim(delim, nodes, indent) {
  for (const node of nodes) {
    yield* print(node, indent);
    yield delim;
  }
}

function getKind(node) {
  try {
    return node.GetType();
  } catch (_) {
    if (node instanceof Identifier) {
      return "Identifier";
    }
    console.log("unkind:", node);
    return null;
  }
}

function logNode(node, depth = 1) {
  console.log(util.inspect(node, { showHidden: false, depth, colors: true }));
}

function* print(node, indent = 0) {
  function writeIndent() {
    if (indent >= 0) {
      return new Array(indent).fill("    ").join("");
    } else {
      return "";
    }
  }

  if (Array.isArray(node)) {
    return yield* printDelim("", node, indent);
  }

  switch (getKind(node)) {
    case "ref": {
      return yield* print(node.pathIdentifiers);
    }

    case "Identifier": {
      return yield node.name;
    }

    case "Knot": {
      yield "\n";
      yield "\n";
      yield `=== ${node.identifier.name} ===`;
      return yield* print(node.content);
    }

    case "Text": {
      if (node.text !== "\n") {
        yield writeIndent();
        yield node.text;
      }
      return;
    }
    case "ContentList": {
      return yield* printDelim("", node.content);
    }

    case "Divert": {
      yield node.toString();
      return;
    }

    case "VAR": {
      yield "\n";
      yield "VAR ";
      yield node.variableIdentifier.name;
      yield " = ";
      yield* print(node.expression);
      return;
    }

    case "CONST": {
      yield "\n";
      yield "CONST ";
      yield node.constantIdentifier.name;
      yield " = ";
      yield* print(node.expression);
      return;
    }

    case "Number": {
      return yield `${node.value}`;
    }

    case "AuthorWarning": {
      yield "\n";
      yield writeIndent();
      yield `TODO: ${node.warningMessage}`;
      return;
    }

    case "Conditional": {
      logNode(node.branches[0]);
      //logNode(node.branches[1]);

      yield "{";
      yield* print(node.initialCondition);
      yield ":";
      yield* print(node.branches);
      yield "}";
      return;
    }

    case "ConditionalSingleBranch": {
      //isTrueBranch: true,
      //matchingEquality: false,
      //isElse: false,
      //isInline: true,
      if (node.isTrueBranch) {
        yield* print(node.content);
      }

      if (node.isElse) {
        if (node.isInline) {
          yield "|";
          yield* print(node.content, -1);
        } else {
          yield "- else";
          yield* print(node.content);
        }
      }

      return;
    }

    case "Choice": {
      yield new Array(node.indentationDepth).fill("  ").join("");
      yield new Array(node.indentationDepth).fill("* ").join("");
      if (node.identifier) {
        yield `(${node.identifier.name}) `;
      }

      if (node.startContent) {
        yield* print(node.startContent);
      }
      if (node.choiceOnlyContent) {
        yield* "[";
        yield* print(node.choiceOnlyContent);
        yield* "]";
      }
      if (node.innerContent) {
        yield* print(node.innerContent);
      }

      return;
    }

    case "Gather": {
      yield "\n";
      yield new Array(node.indentationDepth).fill("  ").join("");
      yield new Array(node.indentationDepth).fill("- ").join("");
      if (node.identifier) {
        yield `(${node.identifier.name}) `;
      }
      return;
    }

    case "variable assignment": {
      if (node.variableIdentifier.name === "__littleBonsaiInternal_Comment") {
        yield "// ";
        yield atob(node.expression.toString());
        return;
      }
      if (node.variableIdentifier.name === "__littleBonsaiInternal_BlankLine") {
        yield "\n";
        return;
      }

      throw node;
    }

    case "Weave": {
      let inChoice = false;
      let scanIndent = indent;
      let gatherClock = 0;
      for (const child of node.content) {
        if (getKind(child) === "Choice" && !inChoice) {
          inChoice = true;
          scanIndent++;
        }

        if (getKind(child) === "Gather" && inChoice) {
          inChoice = false;
          gatherClock = 2;
          scanIndent--;
        }

        if (indent !== -1) {
          yield "\n";
        }

        if (gatherClock > 0) {
          yield* print(child, 0);
        } else {
          yield* print(child, scanIndent);
        }

        gatherClock--;
      }

      return;
    }

    default:
      throw node;
  }
}

async function main(inputFileName) {
  const debug = false;

  console.log(inputFileName);
  const source = await readFile(inputFileName, "utf8");

  const annotated = source
    .split("\n")
    .map((line) => {
      if (line.trim() === "") {
        return "~ __littleBonsaiInternal_BlankLine = true";
      }

      if (line.trim().startsWith("//")) {
        return `~ __littleBonsaiInternal_Comment = "${btoa(
          line.trim().replace(/^\/\//, "").trim()
        )}"`;
      }

      return line;
    })
    .join("\n");

  const ast = parse(annotated);

  const acc = [];
  let error = null;

  try {
    for (const symbol of print(ast)) {
      acc.push(symbol);
    }
  } catch (e) {
    error = e;
  } finally {
    if (!debug) {
      if (error) {
        logNode(error);
        try {
          console.error("kind:", JSON.stringify(getKind(error)));
        } catch (_) {
          console.error("unknown kind");
        }
      }
      console.log(acc.join("").replace(/\n\n+/g, "\n\n"));
    }
  }

  //await writeFile(inputFileName, out);
}

main(...process.argv.slice(2));
