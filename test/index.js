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
      ~ knowledgeState += statesGained
      ~ reach (statesToSet)    // set any other states left to set
      ~ return true           // and we set this state, so true

    - else:
      ~ return false || reach(statesToSet)
    }
    `
	);

	/*
	test(
		"tunnel function",
		`

	The bedroom. This is where it happened. Now to look for clues.
	- (top)
	{ bedroomLightState ? seen:     <- seen_light  }
	<- compare_prints(-> top)
	`
	);

	test(
	"blank gather",
	`
	- - (bedhub)
	* *     [Lift the bedcover]
	I lifted back the bedcover. The duvet underneath was crumpled.
	~ reach (crumpled_duvet)
	~ BedState = covers_shifted
	* *     (uncover) {reached(crumpled_duvet)}
	`
	);


	test(
		"stitch function",
		`
	= compare_prints (-> backto)
	foo
	`
	);
	*/
	t.end();
});
