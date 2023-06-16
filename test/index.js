const t = require("tap");
const prettier = require("prettier");

function parse(src, filepath = "main.ink") {
  return prettier.format(src, {
    parser: "ink",
    plugins: ["."],
  });
}

function test(src, name, filepath) {
  const once = parse(src, filepath);
  t.matchSnapshot(once, name);
  const twice = parse(once, filepath);
  t.equal(once, twice);
}

test("hello world", "basic");
test("{COND:yes please|no thank you}", "inline conditional");
//test("hello world #foo #bar: true #baz", "tagged");
