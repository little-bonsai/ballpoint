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

	test(
		"002",
		`
	{once:
	-  Hi!
	}
	`
	);

	test(
		"003",
		`
    * * V:  Have the other one too.
    - - response line
        response line 2 
  - new topic line one
    new topic line two
	`
	);

	test(
		"004",
		`
		===knot
		x
	- ->-> 
	LIST walkarounddeck = WANNA_WALK_AROUND_DECK, DID_WALK_AROUND_DECK
	`
	);

	t.end();
});
