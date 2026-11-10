import { test } from "node:test";
import assert from "node:assert/strict";
import { scoreRows, scoreSpeedCards, scoreCount } from "./scoring.js";
import { DECK, defaultCardMap, duplicateKeys, cardLabel } from "./cards.js";
import { dominicLetters, parseBulk, isUsable, isComplete, usableKeys, toBulk, KEYS } from "./codes.js";
import { shuffle, randomDigits, randInt } from "./random.js";
import { addTime, recentMs, streak, formatMs } from "./stats.js";

const row = (s) => [...s];
const digits40 = "1234567890".repeat(4);

test("a perfect row of 40 scores 40", () => {
  assert.equal(scoreRows(digits40, row(digits40), 40).total, 40);
});
test("one mistake in a full row halves it, two zero it", () => {
  const one = row(digits40); one[5] = "0";
  assert.equal(scoreRows(digits40, one, 40).total, 20);
  const two = [...one]; two[9] = "1";
  assert.equal(scoreRows(digits40, two, 40).total, 0);
});
test("a blank inside a complete row counts as a mistake", () => {
  const g = row(digits40); g[3] = "";
  assert.equal(scoreRows(digits40 + digits40, [...g, ...row(digits40)], 40).total, 60);
});
test("the last row is marked up to the last digit written", () => {
  const exp = digits40 + digits40;
  const g = [...row(digits40), ...row(digits40.slice(0, 29)), ...Array(11).fill("")];
  assert.equal(scoreRows(exp, g, 40).total, 69);
  g[45] = "x";
  // 29 written with one mistake: half of 29 rounded up = 15
  assert.equal(scoreRows(exp, g, 40).total, 55);
});
test("empty rows in the middle score 0 with no penalty", () => {
  const exp = digits40.repeat(3);
  const g = [...row(digits40), ...Array(40).fill(""), ...row(digits40)];
  const r = scoreRows(exp, g, 40);
  assert.equal(r.total, 80);
  assert.equal(r.rows[1].attempted, false);
});
test("binary rows of 30", () => {
  const exp = "101".repeat(10);
  const g = row(exp); g[0] = "0";
  assert.equal(scoreRows(exp, g, 30).total, 15);
});
test("speed cards: perfect deck uses time, else cards to the first error", () => {
  const deck = shuffle(DECK);
  const perfect = scoreSpeedCards(deck, deck, 16020);
  assert.equal(perfect.perfect, true);
  assert.equal(perfect.points, 1000);
  const g = [...deck]; [g[10], g[11]] = [g[11], g[10]];
  const r = scoreSpeedCards(deck, g, 60000);
  assert.equal(r.perfect, false);
  assert.equal(r.total, 10);
  assert.equal(r.correct, 50);
});
test("count scoring ignores blanks after the last answer", () => {
  assert.equal(scoreCount("12345", ["1", "2", "9", "", ""]).total, 2);
  assert.deepEqual(scoreCount("12345", ["1", "2", "9", "", ""]).mistakes, [2]);
});

test("default card map gives 52 different numbers", () => {
  const map = defaultCardMap();
  assert.equal(new Set(Object.values(map)).size, 52);
  assert.equal(duplicateKeys(map).size, 0);
  assert.equal(map["5H"], "58");
  assert.equal(map.AS, "16");
  assert.equal(map.TC, "03");
  assert.equal(map.QS, "62");
  assert.equal(map.KH, "80");
  assert.equal(duplicateKeys({ ...map, AS: "58" }).has("58"), true);
  assert.equal(cardLabel("TD"), "10♦");
});

test("Dominic letters", () => {
  assert.equal(dominicLetters("15"), "AE");
  assert.equal(dominicLetters("69"), "SN");
  assert.equal(dominicLetters("07"), "OG");
});
test("bulk paste reads commas, tabs and short numbers", () => {
  const { entries, errors } = parseBulk("15, Albert Einstein, writing on a board, slowly\n7\tOscar\tgolfing\nabc, x\n\n42,", "pa");
  assert.deepEqual(entries["15"], { person: "Albert Einstein", action: "writing on a board, slowly" });
  assert.deepEqual(entries["07"], { person: "Oscar", action: "golfing" });
  assert.equal(errors.length, 2);
});
test("usable vs complete entries, and export round trip", () => {
  const sys = { mode: "pa", entries: { "15": { person: "Einstein", action: "" }, "16": { person: "A", action: "b" } } };
  assert.equal(isUsable(sys, "15"), true);
  assert.equal(isComplete(sys, "15"), false);
  assert.deepEqual(usableKeys(sys), ["15", "16"]);
  assert.deepEqual(parseBulk(toBulk(sys), "pa").entries["16"], { person: "A", action: "b" });
  assert.equal(KEYS.length, 100);
});

test("random helpers stay in range", () => {
  for (let i = 0; i < 1000; i++) { const x = randInt(7); assert.ok(x >= 0 && x < 7); }
  assert.match(randomDigits(200), /^\d{200}$/);
  assert.match(randomDigits(60, 2), /^[01]{60}$/);
  assert.deepEqual(shuffle(DECK).sort(), [...DECK].sort());
});
test("recall times", () => {
  let e = addTime(undefined, 900);
  e = addTime(e, null);
  e = addTime(e, 700);
  assert.equal(e.seen, 3);
  assert.equal(e.misses, 1);
  assert.equal(recentMs(e), 900);
  assert.equal(recentMs(undefined), null);
  assert.equal(formatMs(1234), "1.23 s");
  assert.equal(formatMs(75000), "1:15");
});
test("streak counts back from today or yesterday", () => {
  const now = new Date(2026, 10, 9, 12);
  const at = (d) => ({ date: new Date(2026, 10, d, 9).toISOString() });
  assert.equal(streak([at(9), at(8), at(7), at(5)], now), 3);
  assert.equal(streak([at(8), at(7)], now), 2);
  assert.equal(streak([at(6)], now), 0);
});

import { digitGroups, mistakesByGroup } from "./events.js";
test("digit groups stay inside rows", () => {
  const g = digitGroups(80, 40, 6);
  assert.equal(g.length, 14);
  assert.deepEqual(g[6], { row: 0, start: 36, end: 40 });
  assert.deepEqual(g[7], { row: 1, start: 40, end: 46 });
  const of = (i) => g.findIndex((x) => i >= x.start && i < x.end);
  assert.deepEqual(mistakesByGroup(of, [1, 2, 41]), [{ group: 0, indexes: [1, 2] }, { group: 7, indexes: [41] }]);
});

import { EXAMPLES } from "./examples.js";
test("100 examples, and each strict one has the right initials", () => {
  assert.deepEqual(Object.keys(EXAMPLES).sort(), KEYS);
  const people = Object.values(EXAMPLES).map((e) => e.person);
  assert.equal(new Set(people).size, 100);
  for (const [k, e] of Object.entries(EXAMPLES)) {
    assert.ok(e.person && e.action, k);
    const name = e.person.replace(/\(.*?\)/g, "").normalize("NFD").replace(/[̀-ͯ"']/g, "");
    const initials = name.split(/[\s-]+/).filter(Boolean).map((w) => w[0].toUpperCase()).join("");
    const [a, b] = dominicLetters(k);
    const i = initials.indexOf(a);
    const ok = i >= 0 && initials.indexOf(b, i + 1) > i;
    if (e.loose) assert.ok(name.toUpperCase().replace(/[^A-Z]/g, "").startsWith(a + b) || name.toUpperCase().startsWith(a), `${k} loose ${e.person}`);
    else assert.ok(ok, `${k} ${e.person} should have initials ${a}${b}, has ${initials}`);
  }
});
