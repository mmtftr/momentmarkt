/*
 * Audit log — every offer the LLM generated under this merchant's bounds, in
 * reverse-chronological order. Each row carries the trigger that woke the
 * Opportunity Agent, the generated headline + discount, the outcome, and a
 * "block this generation" link that scopes a permanent veto.
 *
 * Per issue #138 + DESIGN_PRINCIPLES.md: reasoning is inspectable; the
 * merchant can see exactly what the LLM produced under their bounds, with
 * the ability to mute individual generations after the fact.
 *
 * Mockup data — 10 entries scripted around the Café Bondi rain demo so the
 * cocoa narrative reads through the entire dashboard.
 */

type AuditOutcome = "redeemed" | "accepted" | "surfaced" | "ignored";

type AuditRow = {
  id: string;
  time: string;
  trigger: string;
  triggerTone: "rain" | "spark" | "cocoa" | "rain-soft";
  headline: string;
  discount: number;
  outcome: AuditOutcome;
  outcomeMeta: string;
};

const ROWS: AuditRow[] = [
  {
    id: "g-2025-04-25-13-30",
    time: "13:30",
    trigger: "Rain incoming + 54% demand gap",
    triggerTone: "rain",
    headline: "Rain incoming — warm up at Bondi",
    discount: 20,
    outcome: "redeemed",
    outcomeMeta: "9 redeemed of 14 surfaced",
  },
  {
    id: "g-2025-04-25-12-45",
    time: "12:45",
    trigger: "Saturday lunch demand gap (38% below baseline)",
    triggerTone: "spark",
    headline: "Banana bread + cocoa — €3 off",
    discount: 15,
    outcome: "accepted",
    outcomeMeta: "11 saved, 4 redeemed so far",
  },
  {
    id: "g-2025-04-25-11-14",
    time: "11:14",
    trigger: "Pre-rain front detected 32 min out",
    triggerTone: "rain-soft",
    headline: "Brunch slot — 10% off cortado + croissant",
    discount: 10,
    outcome: "surfaced",
    outcomeMeta: "6 surfaced, 0 redeemed (rain hadn't landed)",
  },
  {
    id: "g-2025-04-25-10-02",
    time: "10:02",
    trigger: "Quiet morning — 28% below typical",
    triggerTone: "cocoa",
    headline: "Filter coffee, refilled — €1 off",
    discount: 8,
    outcome: "redeemed",
    outcomeMeta: "3 redeemed of 5 surfaced",
  },
  {
    id: "g-2025-04-24-17-22",
    time: "Yesterday 17:22",
    trigger: "Friday wind-down + post-work demand spike upcoming",
    triggerTone: "spark",
    headline: "Aperitivo hour — espresso martini −15%",
    discount: 15,
    outcome: "redeemed",
    outcomeMeta: "12 redeemed of 17 surfaced",
  },
  {
    id: "g-2025-04-24-14-08",
    time: "Yesterday 14:08",
    trigger: "Demand gap (41% below baseline)",
    triggerTone: "spark",
    headline: "Afternoon dip — cocoa + cookie €4.50",
    discount: 12,
    outcome: "ignored",
    outcomeMeta: "Surfaced 0 — no nearby high-intent wallets",
  },
  {
    id: "g-2025-04-24-09-44",
    time: "Yesterday 09:44",
    trigger: "Light rain + commuter window",
    triggerTone: "rain",
    headline: "Wet morning — flat white + croissant deal",
    discount: 10,
    outcome: "accepted",
    outcomeMeta: "8 saved, 5 redeemed",
  },
  {
    id: "g-2025-04-23-19-18",
    time: "Wed 19:18",
    trigger: "Event proximity — concert at Volksbühne 800m away",
    triggerTone: "cocoa",
    headline: "Post-show drinks — late-night kombucha −18%",
    discount: 18,
    outcome: "redeemed",
    outcomeMeta: "6 redeemed of 9 surfaced",
  },
  {
    id: "g-2025-04-23-13-02",
    time: "Wed 13:02",
    trigger: "Demand gap + Wednesday quiet",
    triggerTone: "spark",
    headline: "Working-from-cafe lunch — soup + filter coffee",
    discount: 12,
    outcome: "accepted",
    outcomeMeta: "7 saved, 3 redeemed",
  },
  {
    id: "g-2025-04-23-08-30",
    time: "Wed 08:30",
    trigger: "Cold front + commuter wake-up window",
    triggerTone: "rain",
    headline: "Frosty morning — double cortado for €3",
    discount: 8,
    outcome: "redeemed",
    outcomeMeta: "11 redeemed of 14 surfaced",
  },
];

const OUTCOME_COPY: Record<
  AuditOutcome,
  { label: string; pillClass: string }
> = {
  redeemed: { label: "Redeemed", pillClass: "is-good" },
  accepted: { label: "Accepted", pillClass: "is-cocoa" },
  surfaced: { label: "Surfaced", pillClass: "is-rain" },
  ignored: { label: "Ignored", pillClass: "is-mute" },
};

export function AuditLogSection() {
  return (
    <div className="section-body">
      <header className="section-head">
        <div className="section-head-text">
          <span className="eyebrow">Audit log</span>
          <h1>Every offer the LLM generated under your bounds</h1>
          <p className="lead">
            Time-ordered. Each row shows what woke the Opportunity Agent, the offer it
            generated within your floor/ceiling, and what happened. Block any single
            generation from ever firing again.
          </p>
        </div>
        <div className="section-head-right">
          <span className="head-pill is-muted">
            <strong>{ROWS.length}</strong>&nbsp;generations · last 48h
          </span>
        </div>
      </header>

      <section className="audit-list" role="list">
        {ROWS.map((row) => (
          <AuditRowCard key={row.id} row={row} />
        ))}
      </section>

      <footer className="section-foot">
        <span className="foot-meta">
          Retention: 90 days · Generations older than retention are hashed-only (no headline copy
          retained), per Sparkasse data policy.
        </span>
      </footer>
    </div>
  );
}

function AuditRowCard({ row }: { row: AuditRow }) {
  const outcome = OUTCOME_COPY[row.outcome];
  return (
    <article className="audit-row" role="listitem">
      <div className="audit-time">
        <strong>{row.time}</strong>
        <code>{row.id}</code>
      </div>
      <div className="audit-body">
        <div className="audit-trigger-row">
          <span className={`trigger-chip is-${row.triggerTone}`}>{row.trigger}</span>
        </div>
        <h3>{row.headline}</h3>
        <p className="audit-meta">
          Generated discount: <strong>−{row.discount}%</strong> · within bounds (5%–25%) ·{" "}
          {row.outcomeMeta}
        </p>
      </div>
      <div className="audit-side">
        <span className={`outcome-pill ${outcome.pillClass}`}>{outcome.label}</span>
        <button type="button" className="ghost-link">
          Block this generation
        </button>
      </div>
    </article>
  );
}
