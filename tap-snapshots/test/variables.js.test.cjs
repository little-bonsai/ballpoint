/* IMPORTANT
 * This snapshot file is auto-generated, but designed for humans.
 * It should be checked into source control and tracked carefully.
 * Re-generate by setting TAP_SNAPSHOT=1 and running tests.
 * Make sure to inspect the output below.  Do not ignore changes!
 */
'use strict'
exports[`test/variables.js TAP variables Content List > snap 1`] = `
=== knot ===
    ~ temp noPrefix = "{|Nah, |Sorry, }"
`

exports[`test/variables.js TAP variables Long Lists > snap 1`] = `
LIST breakByExplicitValue = A, B, C, D, 
E = 9, F, G, H, I, J, K, L, M, N, 
(O) = 100, P, Q, R, S, T, U, (V), W, X, Y, Z

LIST breakByLineLength = AListItem, BListItem, CListItem, DListItem, EListItem, FListItem, GListItem, HListItem, 
IListItem, JListItem, KListItem, LListItem, MListItem, NListItem, (OListItem), PListItem, QListItem, 
RListItem, SListItem, TListItem, UListItem, (VListItem), WListItem, XListItem, YListItem, ZListItem
`

exports[`test/variables.js TAP variables declarations > snap 1`] = `
VAR forceful = 0

CONST awesome = true

LIST colors = red, (green), blue

LIST ItemsWithValue = banana = 100, apples, 
carrot = 10, oranges

VAR emptyList = ()
VAR tf2Colors = (red, blue)
`

exports[`test/variables.js TAP variables nested operation > snap 1`] = `
VAR z = 0

~ z = (1 + 2) / ((3 * 4) * 5)
`

exports[`test/variables.js TAP variables variable modification > snap 1`] = `
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
