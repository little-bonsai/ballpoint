const { pipe, getKind, logNode, tap, tapJSON } = require("./util");
const renderers = require("./renderers");

module.exports = function render(node, context) {
	function print(node, printContext = context) {
		return render(node, printContext);
	}

	if (
		context.comments.length > 0 &&
		context.getNodeSourceIndex(node) > context.comments[0]?.index
	) {
		const comment = context.comments.shift();

		return [comment.text, { kind: "Line", force: false }, print(node)];
	}

	return (
		renderers[getKind(node)] ??
		(() => {
			console.error(node);
			throw new Error(`unhandled kind ${getKind(node)}`);
		})
	)({
		node,
		print,
		render,
		context,
	});
};
