require("inkjs/compiler/Parser/InkParser");
require("inkjs/compiler/parser/StatementLevel");

const printers = require("./lib/printers");
const parsers = require("./lib/parsers");

const languages = [
  {
    name: "ink",
    parsers: ["ink"],
    extensions: [".ink", ".inkle"],
  },
];

module.exports = {
  languages,
  parsers,
  printers,
  defaultOptions: {
    tabWidth: 4,
    useTabs: false,
    printWidth: 9999,
  },
};
