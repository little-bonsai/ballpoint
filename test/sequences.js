const t = require("tap");

const { runTest } = require("./utils");

t.test("sequences", (t) => {
	const test = runTest.bind(null, t);

	test(
		"sequences",
		`
{|foo|bar|}
{&|foo|bar|}
{~|foo|bar|}
{!|foo|bar|}
	`
	);

	test(
		"stopping",

		`
{ stopping:
	-	I entered the casino.
	-  I entered the casino again.
	-  Once more, I went inside.
}
`
	);

	test(
		"stopping",
		`
At the table, I drew a card. <>
{ shuffle:
	- 	Ace of Hearts.
	- 	King of Spades.
	- 	2 of Diamonds.
		'You lose this time!' crowed the croupier.
}
`
	);

	test(
		"cycle",
		`
{ cycle:
	- I held my breath.
	- I waited impatiently.
	- I paused.
}
`
	);

	test(
		"once",
		`
{ once:
	- Would my luck hold?
	- Could I win the hand?
}
`
	);

	test(
		"one once",
		`
That's a wrap {once:on this! -> bye} folks!

=== bye
that's all 
`
	);

	test(
		"shuffle once",
		`
{ shuffle once:
-	The sun was hot.
- 	It was a hot day.
}
`
	);

	test(
		"shuffle stopping",
		`
{ shuffle stopping:
- 	A silver BMW roars past.
-	A bright yellow Mustang takes the turn.
- 	There are like, cars, here.
}
`
	);

	t.end();
});
