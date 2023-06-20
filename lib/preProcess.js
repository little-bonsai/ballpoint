const lineColumn = require("line-column");

exports.extractComments = function extractComments(src) {
	function* findWithIndex(regexp, str) {
		let match;
		while ((match = regexp.exec(str)) !== null) {
			yield { text: match[0], index: match.index };
		}
	}

	const getLineCol = (i) => lineColumn(src).fromIndex(i);

	const commentRegexp = /\/\*[\s\S]*?\*\/|([^\\:]|^)\/\/.*$/gm;
	const comments = [...findWithIndex(commentRegexp, src)]
		.map((x) => ({
			...x,
			...getLineCol(x.index),
		}))
		.map(({ text, ...rest }) => ({
			...rest,
			text: text.trim(),
		}))
		.map(({ text, ...rest }) => ({
			...rest,
			text: text.startsWith("//") ? text + "\n" : text,
		}));

	comments.sort((l, r) => l.index - r.index);

	return comments;
};
