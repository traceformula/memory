// Competition scoring, from the WMSC Competitor's and Arbiter's Handbook (3rd edition)
// and the IAM Rulebook (November 2019).

// Numbers and Binary are marked in rows (40 digits for numbers, 30 for binary).
// - A complete row: all correct = full points, one mistake = half, two or more = 0.
// - A missing digit counts as a mistake. Rows left completely empty score 0, with no penalty.
// - The last attempted row is marked up to the last digit written. All correct = that many points,
//   one mistake = half of them rounded up, two or more = 0.
// `given` is an array the same length as `expected`, with "" for a cell left blank.
export function scoreRows(expected, given, rowLen) {
  const rows = [];
  const rowCount = Math.ceil(expected.length / rowLen);
  let lastRow = -1;
  for (let r = 0; r < rowCount; r++) {
    if (given.slice(r * rowLen, (r + 1) * rowLen).some((c) => c !== "")) lastRow = r;
  }
  let total = 0, correct = 0;
  for (let r = 0; r < rowCount; r++) {
    const start = r * rowLen, len = Math.min(rowLen, expected.length - start);
    const cells = given.slice(start, start + len);
    if (!cells.some((c) => c !== "")) { rows.push({ row: r, attempted: false, counted: 0, points: 0, mistakes: [] }); continue; }
    let counted = len;
    if (r === lastRow) {
      let last = cells.length - 1;
      while (last >= 0 && cells[last] === "") last--;
      counted = last + 1;
    }
    const mistakes = [];
    for (let i = 0; i < counted; i++) {
      if (cells[i] === expected[start + i]) correct++;
      else mistakes.push(start + i);
    }
    const points = mistakes.length === 0 ? counted : mistakes.length === 1 ? Math.ceil(counted / 2) : 0;
    total += points;
    rows.push({ row: r, attempted: true, counted, points, mistakes });
  }
  return { total, rows, correct, lastRow };
}

// Memory League–style practice: one point for each digit or card in the right place.
export function scoreCount(expected, given) {
  let correct = 0;
  const mistakes = [];
  let lastGiven = -1;
  given.forEach((c, i) => { if (c !== "") lastGiven = i; });
  for (let i = 0; i <= lastGiven; i++) {
    if (given[i] === expected[i]) correct++;
    else mistakes.push(i);
  }
  return { total: correct, correct, mistakes };
}

// Speed Cards: compare from the top; only the cards before the first difference count.
// A perfect deck is ranked by memorisation time.
export function scoreSpeedCards(expected, given, memoMs) {
  let upTo = 0;
  while (upTo < expected.length && given[upTo] === expected[upTo]) upTo++;
  const perfect = upTo === expected.length;
  const mistakes = [];
  expected.forEach((c, i) => { if (given[i] !== c) mistakes.push(i); });
  const seconds = memoMs / 1000;
  return {
    perfect,
    upTo,
    correct: expected.length - mistakes.length,
    mistakes,
    total: perfect ? Math.round(seconds * 100) / 100 : upTo,
    // WMSC championship points for a perfect deck: 8007.5 / t^0.75 (1000 points at 16.02 s).
    points: perfect && seconds > 0 ? Math.round(8007.5 / Math.pow(seconds, 0.75)) : null,
  };
}
