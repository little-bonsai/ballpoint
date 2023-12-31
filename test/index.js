const t = require("tap");

const { runTest } = require("./utils");

t.test("examples", (t) => {
	const test = runTest.bind(null, t);
	test(
		"function calls and diverts",
		`
	=== armoury_1 ===
	* George: Hello, fellow Hentai Heads -> map_1
	* Jerry: George! You got in to Spooky High too?
	Kramer: Dang, George has used up all the hentai here, we'll have to look elsewhere!
	~ RANDOM(1,2)
	~ RANDOM(1,2)
	-> map_1

	=== map_1
	map
	`
	);

	test(
		"eg2",
		`
	=== function reach(statesToSet)
	~ temp x = pop(statesToSet)
	{
	- not x:
	~ return false

	- not reached(x):
	~ temp chain = LIST_ALL(x)
	~ temp statesGained = LIST_RANGE(chain, LIST_MIN(chain), x)
	~ reach (statesToSet)    
	~ return true           

	- else:
	~ return false || reach(statesToSet)
	}

	=== function reached(x)
	~return false
=== function pop(ref list)
~return false
	`
	);

	t.end();
});
