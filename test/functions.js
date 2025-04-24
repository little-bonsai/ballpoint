const t = require("tap");

const { runTest } = require("./utils");

t.test("functions", (t) => {
	const test = runTest.bind(null, t);

	test("inline call", ` the time is now { RANDOM(1,RANDOM(1,6)) } o'clock `);

	test(
		"outline call",
		`hello
		~ RANDOM(1,RANDOM(1,6))
		world`,
	);

	test(
		"function",
		`
		=== function alter(ref x, k) ===
		~ temp altered = x + k
		~ x = altered
		~ return x
		`,
	);

	test(
		"externals",
		`
		EXTERNAL functionName(a,b,c)
		`,
	);

	test(
		"externals with fallback",
		`
	EXTERNAL functionName(a,b,c)
	=== function functionName(a,b,c)
	~return a + b+ c
	`,
	);

	test(
		"many externals and functions",
		`
EXTERNAL foo()
EXTERNAL makeCampaignId()
=== function makeCampaignId
    ~ return false
EXTERNAL mercerListValueToString(a)

=== function mercerListValueToString(a)
    ~ return false
EXTERNAL mercerDispatchAction0(a)

=== function mercerDispatchAction0(a)
    ~ return false
EXTERNAL mercerDispatchAction1(a, b)

=== function mercerDispatchAction1(a, b)
    ~ return false
EXTERNAL mercerDispatchAction2(a, b, c)

=== function mercerDispatchAction2(a, b, c)
    ~ return false

`,
	);

	test(
		"0-arity function",
		`
	EXTERNAL cutSceneAdvance()
	~ cutSceneAdvance()
	before{ cutSceneAdvance() } after
			`,
	);

	test(
		"calling with list",
		`

	LIST Supporters = on_desk, on_floor, on_bed, under_bed, held, with_joe

	=== function move_to_supporter(ref item_state, new_supporter) ===
	    ~ item_state -= LIST_ALL(Supporters)
		~ item_state += new_supporter
	`,
	);

	t.end();
});
