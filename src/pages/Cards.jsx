import { useState } from "react";
import { useApp } from "../store/context";
import { DECK, defaultCardMap, duplicateKeys, SUIT_NAME, SUITS, VALUES } from "../lib/cards";
import { describe } from "../lib/codes";
import { CardFace, Confirm } from "../components/ui";

export default function Cards() {
  const { cardMap, system, actions } = useApp();
  const [reset, setReset] = useState(false);
  const dup = duplicateKeys(cardMap);
  const missing = DECK.filter((id) => !/^\d\d$/.test(cardMap[id] || ""));

  const set = (id, v) => actions.setCardMap({ ...cardMap, [id]: v.replace(/\D/g, "").slice(0, 2) });

  return (
    <div className="stack lg">
      <div className="stack sm">
        <h1>Cards</h1>
        <p className="muted">Each card points to a number, so a card's image is the person you already made for that number. You learn one system, not two.</p>
      </div>

      <div className="panel stack sm small">
        <b>How the default works</b>
        <p className="muted">It uses Dominic letters. Suits: ♣ Clubs = C = 3, ♦ Diamonds = D = 4, ♠ Spades = S = 6, ♥ Hearts = H = 8.</p>
        <p className="muted">Number cards are value then suit, with A = 1 and 10 = O = 0: 5♥ is E·H = <b>58</b>, A♠ is A·S = <b>16</b>, 10♣ is O·C = <b>03</b>.</p>
        <p className="muted">Picture cards are suit then J = 1, Q = 2, K = 0: Q♠ = <b>62</b>, K♥ = <b>80</b>, J♦ = <b>41</b>.</p>
        <p className="muted">Change any of them. Many people give picture cards their own people, such as kings to family members.</p>
      </div>

      {(dup.size > 0 || missing.length > 0) && (
        <div className="notice warn small">
          {dup.size > 0 && <div>Two cards share {[...dup].join(", ")}. Each card needs its own number.</div>}
          {missing.length > 0 && <div>{missing.length} card{missing.length === 1 ? " has" : "s have"} no two-digit number yet.</div>}
        </div>
      )}

      {SUITS.map((s) => (
        <section key={s} className="stack sm">
          <h2>{SUIT_NAME[s]}</h2>
          <div className="grid3">
            {VALUES.map((v) => {
              const id = v + s, key = cardMap[id] || "";
              return (
                <div key={id} className="item" style={{ padding: "8px 10px" }}>
                  <CardFace id={id} size="md" />
                  <div className="stack sm grow">
                    <input value={key} inputMode="numeric" aria-label={`Number for ${id}`} style={{ width: 70, fontFamily: "var(--mono)", padding: "5px 8px", borderColor: dup.has(key) ? "var(--bad)" : undefined }}
                      onChange={(e) => set(id, e.target.value)} />
                    <span className="tiny muted" style={{ overflowWrap: "anywhere" }}>{key.length === 2 ? describe(system, key) || "No image yet for " + key : ""}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ))}
      <div><button className="btn" onClick={() => setReset(true)}>Reset to the default</button></div>
      <Confirm open={reset} title="Reset the card map?" text="Every card goes back to the Dominic default described above." yes="Reset"
        onNo={() => setReset(false)} onYes={() => { actions.setCardMap(defaultCardMap()); setReset(false); }} />
    </div>
  );
}
