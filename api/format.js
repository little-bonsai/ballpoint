const formatInk = require("../lib/format");

module.exports = (req, res) => {
  const src = req.body;

  const out = formatInk(src);

  res.json({
    out,
  });
};
