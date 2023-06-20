const t = require("tap");

const { runTest } = require("./utils");

t.test("variables", (t) => {
	const test = runTest.bind(null, t);

	test(
		"declarations",
		`
	  VAR forceful = 0
CONST awesome = true
LIST colors = red, (green), blue
VAR emptyList = ()
`
	);

	test(
		"variable modification",
		`
~ num++
~ num--
~ num = 2
~ num += 3
~ num -= 4

~ str = "hello"
~ str = "world"
`
	);

	t.end();
});
