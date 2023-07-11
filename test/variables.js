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
LIST ItemsWithValue =  banana = 100,  apples, carrot = 10, oranges
VAR emptyList = ()
VAR tf2Colors = (red, blue)
`
	);

	test(
		"variable modification",
		`
		VAR num = 0
		VAR str = ""
~ num++
~ num--
~ num = 2
~ num += 3
~ num -= 4

~ str = "hello"
~ str = "world"
`
	);

	test(
		"nested operation",
		`
	VAR z = 0
	~z = (1 + 2) / (3 * 4 * 5)
	`
	);

	test(
		"Content List",
		`
===knot
~ temp noPrefix = "{|Nah, |Sorry, }"
`
	);

	test(
		"Long Lists",
		`
LIST breakByExplicitValue = A,
B,
C,
D,
E = 9,
F,
G,
H,
I,
J,
K,
L,
M,
N,
(O) = 100,
P,
Q,
R,
S,
T,
U,
(V),
W,
X,
Y,
Z

LIST breakByLineLength = AListItem,
BListItem,
CListItem,
DListItem,
EListItem,
FListItem,
GListItem,
HListItem,
IListItem,
JListItem,
KListItem,
LListItem,
MListItem,
NListItem,
(OListItem),
PListItem,
QListItem,
RListItem,
SListItem,
TListItem,
UListItem,
(VListItem),
WListItem,
XListItem,
YListItem,
ZListItem
`
	);

	t.end();
});
