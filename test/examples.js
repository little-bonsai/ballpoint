const t = require("tap");

const { runTest } = require("./utils");

t.test("examples", (t) => {
	const test = runTest.bind(null, t);
	test(
		"001",
		`
LIST l = CARSTAIRS_KNOWS_EARRING_YOURS, KNOW_MALC_IN_DEBT_CARSTAIRS

~ reached((CARSTAIRS_KNOWS_EARRING_YOURS,  KNOW_MALC_IN_DEBT_CARSTAIRS))

=== function reached(x)
~return false

	`
	);

	t.end();
});
