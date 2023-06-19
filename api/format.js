const formatInk = require("../lib/format");

module.exports = (req, res) => {
  const src = req.body;

  try {
    const out = formatInk(src);

    res.json({
      out,
    });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};
