// Playing cards, and the map from each card to a number in the number system.

export const SUITS = ["S", "H", "D", "C"];
export const SUIT_SYMBOL = { S: "♠", H: "♥", D: "♦", C: "♣" };
export const SUIT_NAME = { S: "Spades", H: "Hearts", D: "Diamonds", C: "Clubs" };
export const VALUES = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "T", "J", "Q", "K"];

// A new deck's order, suit by suit. Used for the recall picker.
export const DECK = SUITS.flatMap((s) => VALUES.map((v) => v + s));

export const valueLabel = (id) => (id[0] === "T" ? "10" : id[0]);
export const cardLabel = (id) => valueLabel(id) + SUIT_SYMBOL[id[1]];
export const isRed = (id) => id[1] === "H" || id[1] === "D";

// Dominic-style default. Suits use Dominic letters: Clubs C=3, Diamonds D=4, Spades S=6, Hearts H=8.
// Number cards: value then suit (A=1, 10=0 for "O"). 5♥ → E,H → 58.
// Picture cards: suit then J=1, Q=2, K=0. Q♠ → 62.
// Number cards always end in 3, 4, 6 or 8 and picture cards never do, so all 52 are different.
export const SUIT_DIGIT = { C: "3", D: "4", S: "6", H: "8" };
const VALUE_DIGIT = { A: "1", T: "0" };
const FACE_DIGIT = { J: "1", Q: "2", K: "0" };

export function defaultCardMap() {
  const map = {};
  for (const id of DECK) {
    const [v, s] = id;
    map[id] = FACE_DIGIT[v] ? SUIT_DIGIT[s] + FACE_DIGIT[v] : (VALUE_DIGIT[v] || v) + SUIT_DIGIT[s];
  }
  return map;
}

// Numbers that more than one card points to.
export function duplicateKeys(map) {
  const seen = {}, dup = new Set();
  for (const id of DECK) {
    const k = map[id];
    if (!k) continue;
    if (seen[k]) dup.add(k);
    seen[k] = true;
  }
  return dup;
}
