const util = require("util");
const {
	Identifier,
} = require("../vendor/compiler/Parser/ParsedHierarchy/Identifier");
const { Path } = require("../vendor/compiler/Parser/ParsedHierarchy/Path");
const {
	Argument,
} = require("../vendor/compiler/Parser/ParsedHierarchy/Argument");
const {
	IncludedFile,
} = require("../vendor/compiler/Parser/ParsedHierarchy/IncludedFile");
const {
	VariableAssignment,
} = require("../vendor/compiler/Parser/ParsedHierarchy/Variable/VariableAssignment");

exports.getKind = function getKind(node, silent) {
	if (!node) {
		return "Null";
	}

	if (Array.isArray(node)) {
		return "Array";
	}

	if (node instanceof IncludedFile) {
		return "IncludedFile";
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

		/* istanbul ignore next */
		if (!silent) {
			console.error("unkind:", node);
		}

		/* istanbul ignore next */
		return null;
	}
};

exports.pipe = function pipe(...fns) {
	return function doPipe(data) {
		return fns.reduce((data, fn) => fn(data), data);
	};
};

/* istanbul ignore next */
exports.logNode = function logNode(...xs) {
	console.error(
		...xs.map((x) =>
			util.inspect(x, { showHidden: false, depth: 1, colors: true }),
		),
	);
};

/* istanbul ignore next */
exports.tap = function tap(x) {
	console.error(x);
	return x;
};

/* istanbul ignore next */
exports.tapJSON = function tapJSON(x) {
	console.error(JSON.stringify(x, null, 2));
	return x;
};

exports.getLinesInRendered = function getLinesInRendered(rendered) {
	return (rendered ?? [])
		.flat(Infinity)
		.filter((x) => x?.kind === "Line")
		.reduce((acc, x) => acc + (x.lines ?? 1), 0);
};
