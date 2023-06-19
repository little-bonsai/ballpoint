#!/usr/bin/env node

const fs = require("fs/promises");
const arg = require("arg");

require("inkjs/compiler/Parser/InkParser");
require("inkjs/compiler/parser/StatementLevel");

const format = require("./lib/format");

async function main(args) {
  if (args["--help"]) {
    return printHelp();
  }

  for (const inputFilename of args._) {
    const src = await fs.readFile(inputFilename, "utf8");
    const out = format(src, inputFilename);

    console.log(out);
  }
}

const argSpec = {
  // General
  "--help": Boolean,
  "--version": Boolean,
  "--verbose": arg.COUNT, // Counts the number of times --verbose is passed

  "--sort-includes": Boolean,
  "--write": Boolean,

  // Aliases
  "-h": "--help",
  "-w": "--write",
  "-v": "--verbose",
};

function printHelp() {
  console.log(
    `
Ballpoint
A CLI for formatting .ink files

Usage:
         $ ballpoint --sort-includes --write **/*.ink

Arguments:
        --help
        --version
        --verbose

        --sort-includes  : Sort all INCLUDE statements in the file
        --write          : Overwrite the files

        / Aliases
        -h = --help
        -w = --write
        -s = --sort-includes
        -v = --verbose
`.trim(),
    "\n"
  );
}

main(arg(argSpec, { permissive: true, argv: process.argv.slice(2) }));
