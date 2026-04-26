/*
 * Insights — privacy-preserving aggregate text. Per DESIGN_PRINCIPLES.md the
 * privacy commitment is structural: no individual customer data ever reaches
 * the merchant. Only k-anonymous aggregates over the city's catalog leave
 * the device.
 *
 * The disclosure pill at the top is the contract — every insight on this
 * surface respects the wrapped {intent_token, h3_cell_r8} boundary.
 */

import { PrivacyIcon } from "../icons/NavIcons";

type Insight = {
  id: string;
  headline: string;
  body: string;
  accent: "rain" | "spark" | "cocoa" | "good" | "warn";
  metric?: string;
};

const INSIGHTS: Insight[] = [
  {
    id: "rain-trigger-share",
    headline: "70% of acceptances came during rain triggers",
    body: "Across the last 30 days, rain-fired offers converted 2.1× as well as time-of-day-only offers. Worth keeping the rain ceiling generous.",
    accent: "rain",
    metric: "70%",
  },
  {
    id: "weekend-lunch-gap",
    headline: "Weekend lunch is your softest demand gap",
    body: "Saturday + Sunday between 13:00–14:30 you sit 38–54% below typical. The Opportunity Agent fired 11 offers in this window last weekend.",
    accent: "spark",
    metric: "−46%",
  },
  {
    id: "dwell-benchmark",
    headline: "Average dwell on your cards: 1.3s (above category benchmark of 0.9s)",
    body: "Your headlines are out-performing the cafe-category baseline. The dwell signal feeds the Negotiation Agent's confidence to push slightly tighter discounts next surface.",
    accent: "good",
    metric: "1.3s",
  },
  {
    id: "category-mix",
    headline: "Bakery items convert 1.8× drinks-only offers",
    body: "Bundling banana bread with the cocoa raised redemption from 14% to 25%. The LLM has been weighting bundles higher since the third weekend.",
    accent: "cocoa",
    metric: "1.8×",
  },
  {
    id: "ceiling-headroom",
    headline: "You're using 62% of your discount ceiling on average",
    body: "Headroom for the Negotiation Agent to push aggressively in the next high-rejection cluster without breaching your 25% ceiling.",
    accent: "warn",
    metric: "62%",
  },
];

export function InsightsSection() {
  return (
    <div className="section-body">
      <header className="section-head">
        <div className="section-head-text">
          <span className="eyebrow">Insights</span>
          <h1>Aggregate patterns the LLM is reading</h1>
          <p className="lead">
            Pattern summaries the agents extract from the city catalog and your generation
            history. None of these are derived from individual customer records.
          </p>
        </div>
      </header>

      <div className="privacy-banner" role="note">
        <PrivacyIcon className="privacy-banner-icon" aria-hidden />
        <div>
          <strong>Anonymous aggregates only — no individual customer data ever.</strong>
          <small>
            Preferences stay on-device per <code>context/DESIGN_PRINCIPLES.md §3</code>. Only
            wrapped <code>{`{intent_token, h3_cell_r8}`}</code> tuples cross the boundary.
            Insights below are k-anonymous aggregates with k≥25.
          </small>
        </div>
      </div>

      <section className="insights-grid">
        {INSIGHTS.map((insight) => (
          <InsightCard key={insight.id} insight={insight} />
        ))}
      </section>

      <footer className="section-foot">
        <span className="foot-meta">
          Aggregated nightly from <strong>3,142</strong> wrapped intent tokens (last 30 days).
          No individual customer is ever identifiable; rows with <strong>k&lt;25</strong> are
          suppressed entirely.
        </span>
      </footer>
    </div>
  );
}

function InsightCard({ insight }: { insight: Insight }) {
  return (
    <article className={`insight-card accent-${insight.accent}`}>
      {insight.metric ? (
        <span className="insight-metric">{insight.metric}</span>
      ) : null}
      <h3>{insight.headline}</h3>
      <p>{insight.body}</p>
    </article>
  );
}
