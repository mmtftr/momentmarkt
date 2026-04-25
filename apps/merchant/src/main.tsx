import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import density from "../../../data/transactions/berlin-density.json";
import "./styles.css";

function findCafeBondi() {
  const cafeBondi = density.merchants.find(
    (entry) => entry.id === "berlin-mitte-cafe-bondi",
  );

  if (!cafeBondi) {
    throw new Error("Cafe Bondi is missing from berlin-density.json");
  }

  return cafeBondi;
}

const merchant = findCafeBondi();

const latestSample = merchant.live_samples.find((sample) =>
  sample.time_local.includes("13:30:00"),
);
const approvalRule = merchant.autopilot_rule_hints;
const cashbackPerRedeem = merchant.offer_budget.max_cashback_eur;
const surfaced = Math.round(merchant.demand_gap.gap_density_points * 0.4);
const accepted = merchant.inventory_goal.target_redemptions;
const redeemed = Math.min(7, accepted);
const spentBudget = redeemed * cashbackPerRedeem;
const remainingBudget = merchant.offer_budget.total_budget_eur - spentBudget;

function euro(amount: number) {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: density.currency,
    maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
  }).format(amount);
}

function percent(value: number) {
  return new Intl.NumberFormat("en", {
    style: "percent",
    maximumFractionDigits: 0,
  }).format(value);
}

function App() {
  const [eventRuleEnabled, setEventRuleEnabled] = useState(false);
  const budgetUsedPercent = Math.round(
    (spentBudget / merchant.offer_budget.total_budget_eur) * 100,
  );

  return (
    <main className="shell">
      <section className="hero-panel">
        <div>
          <p className="eyebrow">MomentMarkt Merchant Inbox</p>
          <h1>{merchant.display_name}</h1>
          <p className="subhead">
            Opportunity Agent is watching rain, local demand, and nearby intent
            signals for the Berlin lunch window.
          </p>
        </div>
        <div className="status-pill">
          <span className="pulse" /> Auto-approved 3h ago
        </div>
      </section>

      <section className="summary-grid" aria-label="Campaign summary">
        <Metric label="Surfaced" value={surfaced.toString()} detail="nearby high-intent wallets" />
        <Metric label="Accepted" value={accepted.toString()} detail="saved to wallet" />
        <Metric label="Redeemed" value={redeemed.toString()} detail="simulated checkout" />
        <Metric
          label="Budget left"
          value={euro(remainingBudget)}
          detail={`${euro(spentBudget)} used of ${euro(merchant.offer_budget.total_budget_eur)}`}
        />
      </section>

      <section className="content-grid">
        <article className="draft-card">
          <div className="card-topline">
            <span>Opportunity Agent draft</span>
            <span className="approved">Approved by rule</span>
          </div>
          <h2>Rain + demand rescue offer for Mia</h2>
          <p className="offer-copy">“Es regnet bald. 80 m bis zum heissen Kakao.”</p>
          <div className="offer-box">
            <div>
              <span className="label">Offer</span>
              <strong>{euro(cashbackPerRedeem)} cashback</strong>
              <small>on hot cocoa + banana bread</small>
            </div>
            <div>
              <span className="label">Expires</span>
              <strong>15:00</strong>
              <small>before the lunch dip closes</small>
            </div>
          </div>
          <div className="evidence-row">
            <Evidence label="Weather" value="Rain incoming" />
            <Evidence label="Demand gap" value={`${percent(merchant.demand_gap.gap_ratio)} below usual`} />
            <Evidence label="Distance" value={`${merchant.distance_m} m from Mia`} />
          </div>
          <p className="agent-note">
            Saturday 13:30 density is {merchant.demand_gap.live_density} vs. a
            typical {merchant.demand_gap.typical_density}. Latest sample shows
            {" "}{latestSample?.observed_transactions ?? "9"} transactions,
            so the rule cleared the approval threshold without merchant review.
          </p>
        </article>

        <aside className="rules-panel">
          <div className="section-heading">
            <p className="eyebrow">Autopilot rules</p>
            <h2>Trust gradient</h2>
          </div>

          <RuleRow
            title="Rain + demand lunch save"
            description="Auto-approve when rain is incoming, demand is at least 20% below baseline, and the customer is within 250 m."
            enabled={approvalRule.approved}
            locked
          />

          <RuleRow
            title="Post-event cocoa boost"
            description="Auto-approve after nearby event exits if Bondi has budget left and live density stays below baseline."
            enabled={eventRuleEnabled}
            onToggle={() => setEventRuleEnabled((enabled) => !enabled)}
          />

          <div className="rule-detail">
            <span>Matched rule</span>
            <code>{approvalRule.rule_id}</code>
            <ul>
              {approvalRule.conditions.map((condition) => (
                <li key={condition}>{condition}</li>
              ))}
            </ul>
          </div>
        </aside>
      </section>

      <section className="footer-strip">
        <div>
          <span className="label">Payone-style fixture</span>
          <strong>{density.fixture_id}</strong>
        </div>
        <div>
          <span className="label">Privacy boundary</span>
          <code>{`{ intent_token, h3_cell_r8: "${density.demo_context.mia_position.h3_cell_r8}" }`}</code>
        </div>
        <div className="budget-bar" aria-label={`${budgetUsedPercent}% budget used`}>
          <span style={{ width: `${budgetUsedPercent}%` }} />
        </div>
      </section>
    </main>
  );
}

function Metric({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <article className="metric-card">
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{detail}</small>
    </article>
  );
}

function Evidence({ label, value }: { label: string; value: string }) {
  return (
    <div className="evidence-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function RuleRow({
  title,
  description,
  enabled,
  locked = false,
  onToggle,
}: {
  title: string;
  description: string;
  enabled: boolean;
  locked?: boolean;
  onToggle?: () => void;
}) {
  return (
    <div className="rule-row">
      <div>
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
      <button
        className={`toggle ${enabled ? "toggle-on" : ""}`}
        type="button"
        onClick={onToggle}
        disabled={locked}
        aria-pressed={enabled}
      >
        <span />
      </button>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
