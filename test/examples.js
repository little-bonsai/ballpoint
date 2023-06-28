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

	test(
		"005",
		`
CONST GOBLIN_SAY_LAND_IS_DONE_FOR = true
CONST ICEY = "it is icey"

=== function reached(x)
~return true

=== knot
	  *   (donefor) { reached(GOBLIN_SAY_LAND_IS_DONE_FOR)} 
        [{ICEY} - "You said the land is done for." ] 
		MOIRA: You said the land is done for.
		`
	);

	test(
		"006",
		`  
		
	*   -> 
		ICEY:   May your crampons never slip! 
		`
	);

	test(
		"007",
		`    
		VAR hasItem = true

	{hasItem:
            +   [ Choice ] 
                 -> divert   
	} 

		=== divert
		divert
	`
	);

	t.end();
});
