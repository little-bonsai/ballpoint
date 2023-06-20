const t = require("tap");

const { runTest } = require("./utils");

t.test("examples", (t) => {
	const test = runTest.bind(null, t);
	test(
		"function calls and diverts",
		`
	  === armoury_1 ===
* George: Hello, fellow Hentai Heads -> map_2
* Jerry: George! You got in to Spooky High too?
Kramer: Dang, George has used up all the hentai here, we'll have to look elsewhere!
~ RANDOM(1,2)
~ RANDOM(1,2)
-> map_1
`
	);
	t.end();
});
