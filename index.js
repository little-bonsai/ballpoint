#!/usr/bin/env node

const fs = require("fs/promises");
const fsSync = require("fs");
const arg = require("arg");

require("inkjs/compiler/Parser/InkParser");
require("inkjs/compiler/Parser/StatementLevel");

const format = require("./lib/format");
const validate = require("./lib/validate");

function doValidation(args, src, out, inputFilename) {
	const validation = validate(src, out, inputFilename);

	if (validation) {
		if (typeof validation === "string") {
			return validation;
		}

		const lineNumber = Number(validation.message.match(/\d+/));
		return (
			validation +
			"\n\n" +
			out
				.split("\n")
				.flatMap((line, i, { length }) => {
					const lineMarker = String(i + 1).padEnd(
						1 + Math.ceil(Math.log10(length)),
						" "
					);

					return i === lineNumber - 1
						? [
								lineMarker + line,

								new Array(1 + Math.ceil(Math.log10(length)))
									.fill(" ")
									.join("") +
									new Array(line.length).fill("^").join(""),
						  ]
						: lineMarker + line;
				})
				.slice(Math.max(0, lineNumber - 3), lineNumber + 4)
				.join("\n")
		);
	}

	return validation;
}

async function doForFile(args, inputFilename) {
	const src = await fs.readFile(inputFilename, "utf8");
	const { data, error: formatError } = format(src, inputFilename, {});

	if (formatError) {
		return { error: formatError };
	}

	if (args["--validate"]) {
		const validationError = doValidation(args, src, data, inputFilename);
		if (validationError) {
			return { error: validationError, info: data };
		}
	}

	if (args["--write"]) {
		await fs.writeFile(inputFilename, data);
		return {};
	} else {
		return { info: data };
	}
}

async function doForStdIn() {
	const src = fsSync.readFileSync(process.stdin.fd, "utf8");
	const { data, error: formatError } = format(src, "./stdin.ink", {});

	if (formatError) {
		return src;
	} else {
		process.stdout.write(data);
	}
}

async function main(args) {
	if (args["--help"]) {
		return printHelp();
	}
	if (args["--verbose"]) {
		console.log({ args });
		console.log("");
	}

	if (args["--stdin"]) {
		await doForStdIn();
	}

	for (const inputFilename of args._) {
		process.stdout.write(inputFilename);
		const { error, info } = await doForFile(args, inputFilename);

		if (error) {
			process.stdout.write(" [ Error ]\n");
			if (args["--verbose"]) {
				console.log(info);
			}
			console.log(error);
			break;
		}

		process.stdout.write(" [ Ok ]\n");
		if (info) {
			console.log(info);
		}

		continue;
	}
}

const argSpec = {
	// General
	"--help": Boolean,
	"--version": Boolean,
	"--verbose": arg.COUNT, // Counts the number of times --verbose is passed

	"--stdin": Boolean,
	"--write": Boolean,
	"--validate": Boolean,

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
         $ ballpoint --write **/*.ink

Arguments:
        --help
        --version
        --verbose

        --stdin          : Read input from stdin, output to stdout
        --validate       : Compile the formatted output & check against the compiled input for diferences
        --write          : Overwrite the files

        / Aliases
        -h = --help
        -w = --write
        -v = --verbose
`.trim(),
		"\n"
	);
}

main(arg(argSpec, { permissive: true, argv: process.argv.slice(2) }));
