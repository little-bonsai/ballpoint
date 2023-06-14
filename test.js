const prettier = require("prettier");

const code = "=== testStitch ===";

prettier.format(code, {
  parser: "ink",
  plugins: ["."],
});
