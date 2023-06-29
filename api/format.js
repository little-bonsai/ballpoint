const formatInk = require("../lib/format");

module.exports = (req, res) => {
	const src = req.body;

	try {
		const { data, error } = formatInk(src);

		if (error) {
			res.status(400).json({ error: error.message ?? error });
		} else {
			res.json({
				data,
			});
		}
	} catch (e) {
		res.status(400).json({ error: error.message ?? error });
	}
};
