const t = require("tap");
const fs = require("fs/promises");
const path = require("path");

const { runTest } = require("./utils");

async function runForFile(fileName, t) {
	const test = runTest.bind(null, t);
	const src = await fs.readFile(path.join(__dirname, fileName), "utf8");

	test(fileName, src);
	t.end();
}

t.test("Intercept", runForFile.bind(null, "intercept.ink"));
t.test("Example", runForFile.bind(null, "example.ink"));
