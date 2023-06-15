// Character variables. We track just two, using a +/- scale
VAR forceful = 0
CONST awesome = true
TODO: some thing must be done

/*
{ DEBUG_INLINE : you are tester | hello production }
{DEBUG_MULTI:
	you are tester
	- else :hello production
}

{DEBUG:
	IN DEBUG MODE!
	*	[Beginning...]	-> start
	*	[Framing Hooper...] -> claim_hooper_took_component
	*	[In with Hooper...] -> inside_hoopers_hut
- else:
	// First diversion: where do we begin?
 -> start
}
*/

=== indentTest1 ===
* one
one child
** two 
two child
*** three
three child
- -> DONE

=== testStitch ===
hello world
* out
* one
* * one point one
*** one point one point one
sub ooo
*** one point one point two
sub oot
--- gather alpha
* * one point two
-- gather beta
* two
* three
* four
* five
- gather sigma
this is your choice:
* choice one [ if you ] dare
but will you?
TODO: flesh out this choice
* * yes
wow, look at mr cool guy
many 
lines 
go 
here
+ + (dangerousChoice) no
piss off ->          fightScene.rumble
- - wow, alright, I'm super impressed
* choice two
wow, bold move
* choice three
what else?
- gather
but now
I will ask another question
* yes, I say
* no, I say
 -> DONE
