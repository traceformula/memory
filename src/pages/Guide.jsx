import { Link } from "react-router-dom";

export default function Guide() {
  return (
    <article className="prose">
      <h1>How memory champions do it</h1>
      <p>Memory champions are not born with special memories. When researchers scanned top memorisers (Maguire and others, 2003), their brains looked ordinary; what they shared was one technique. In a 2017 study (Dresler and others, <i>Neuron</i>), complete beginners trained it for 30 minutes a day for 6 weeks. Their word recall went from about 26 to about 62, and they still had most of the gain four months later.</p>

      <h2>The three parts</h2>
      <ol>
        <li><b>Journeys.</b> Routes through places you know well, split into stops in a fixed order. Dominic O'Brien calls them journeys; others say memory palaces or the method of loci. <Link to="/journeys">Build them here.</Link></li>
        <li><b>A code learned in advance.</b> Every pair of digits, and every card, has a fixed image you know so well it comes in under a second. This is most of the work. <Link to="/system">Your number system.</Link></li>
        <li><b>Placing images.</b> Put the images at the stops so they touch them: break, burn, soak, crush. Exaggeration, movement, sound and feeling make them stick. To recall, walk the route again.</li>
      </ol>

      <h2>The Dominic system</h2>
      <p>Each digit is a letter: 1 = A, 2 = B, 3 = C, 4 = D, 5 = E, 6 = S, 7 = G, 8 = H, 9 = N, 0 = O. Each pair of digits gives two letters, the initials of a person, and each person has one signature action. 15 is A·E, Albert Einstein, writing on a blackboard.</p>
      <p>For four digits, picture the first pair's person doing the second pair's action: 1534 is Einstein doing Charles Darwin's action. That is one image per stop, and only 200 things to learn (100 people and 100 actions).</p>
      <p>Choose people you feel something about: family, friends, people you admire or can't stand. The initials are only a starting point.</p>
      <p>Cards reuse the same people: each card <Link to="/cards">points to a number</Link>.</p>

      <h2>The plan</h2>
      <ol>
        <li><b>Week 0.</b> Test yourself once with Speed Numbers and a practice deck, so you know where you started. Build 3 journeys of 20–30 stops.</li>
        <li><b>Weeks 1–4: build the code.</b> Write 10 or more people and actions a day and learn them with spaced review. When all 100 are in, do speed runs until each image comes in under a second and all 100 take under 2 minutes, then under 1.</li>
        <li><b>Weeks 4–12: events.</b> Numbers and cards. Accuracy first: one mistake can cost a whole row. Start at 1 card per stop, then 2. Add rows or cut time only once you are accurate.</li>
        <li><b>After that:</b> more journeys (10 or more), binary, and the other events. Once a week, a full mock competition.</li>
      </ol>
      <p>Every day: 30–45 minutes. The <Link to="/">Today</Link> page works out your stage and lists what to do.</p>
      <p>After every mistake, ask why. A weak image, a lost stop and a weak placement each need a different fix, which is why the app asks.</p>

      <h2>Rough benchmarks</h2>
      <ul>
        <li>A deck in about 10 minutes within your first few weeks.</li>
        <li>Under 2 minutes after a few months of daily practice.</li>
        <li>Under 1 minute is serious competitor level. The best are under 20 seconds.</li>
        <li>Speed Numbers: the world record listed in the WMSC handbook was 520 digits in 5 minutes (as of 2018).</li>
      </ul>

      <h2>How events are scored</h2>
      <ul>
        <li><b>Speed Numbers</b> (World Memory Championships): 5 minutes to memorise, 15 to recall, rows of 40. A correct row is 40 points; one mistake (a blank counts) halves it to 20; two or more scores 0. The last row you attempt counts up to the last digit you wrote, with the same halving, rounded up. Empty rows score 0, with no penalty.</li>
        <li><b>Binary</b> (IAM, 5-minute): rows of 30, scored the same way (30, 15, 0).</li>
        <li><b>Speed Cards</b>: up to 5 minutes to memorise one deck, 5 to recall. A perfect deck is ranked by time and earns 8007.5 ÷ time<sup>0.75</sup> championship points (1000 at 16 seconds). Otherwise only the cards before the first mistake count.</li>
        <li><b>Memory League style</b>: short rounds, up to 1 minute to memorise and 4 to recall. This app gives one point per correct digit or card; check memoryleague.com for the official game rules.</li>
      </ul>
      <p className="small muted">Sources: WMSC Competitor's and Arbiter's Handbook (3rd edition) and the IAM Rulebook (November 2019).</p>

      <h2>Using the app</h2>
      <ul>
        <li>Drills: <span className="kbd">space</span> shows the answer or counts as “got it”, <span className="kbd">1</span>–<span className="kbd">4</span> grade a review, <span className="kbd">x</span> marks a miss in a speed run.</li>
        <li>Memorising: <span className="kbd">space</span> or arrows move the highlight. Tap a group to jump to it.</li>
        <li>Number recall: type digits; <span className="kbd">space</span> skips one, arrows move, <span className="kbd">⌫</span> deletes.</li>
        <li>Card recall: tap cards in order, or type value then suit (<span className="kbd">q</span><span className="kbd">h</span> = Q♥, <span className="kbd">t</span> = 10).</li>
        <li>Everything is saved in this browser only. <Link to="/data">Back it up</Link> now and then, and use the backup to move to another device.</li>
      </ul>
    </article>
  );
}
