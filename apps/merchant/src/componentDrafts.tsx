import { StrictMode, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import density from "../../../data/transactions/berlin-density.json";
import "./componentDrafts.css";

type DensityPoint = {
  time: string;
  density: number;
  expected_transactions?: number;
};

type LivePoint = {
  time_local: string;
  density: number;
  observed_transactions: number;
};

type Merchant = {
  id: string;
  display_name: string;
  category: string;
  distance_m: number;
  trigger_tags: string[];
  merchant_goal: string;
  typical_density_curve: { points: DensityPoint[] };
  live_samples: LivePoint[];
  demand_gap: {
    typical_density: number;
    live_density: number;
    gap_density_points: number;
    gap_ratio: number;
    threshold_ratio: number;
    status: string;
    triggers_demand_gap: boolean;
    reason: string;
  };
  inventory_goal: {
    item: string;
    target_redemptions: number;
    expires_local: string;
  };
  offer_budget: {
    max_discount_percent: number;
    max_cashback_eur: number;
    total_budget_eur: number;
  };
  autopilot_rule_hints: {
    approved: boolean;
    rule_id: string;
    conditions: string[];
    surface_copy_hint: string;
  };
};

type DensityFixture = {
  city: string;
  currency: string;
  demo_context: {
    demo_time_local: string;
    weather_trigger: string;
  };
  merchants: Merchant[];
};

type QueueState = "suggested" | "approved" | "rejected";

type MerchantDraft = Merchant & {
  queueState: QueueState;
  recommendation: string;
  projectedRedemptions: number;
  spent: number;
  acceptance: number;
};

const fixture = density as DensityFixture;
const initialDrafts: MerchantDraft[] = fixture.merchants.map((merchant, index) => {
  const gap = merchant.demand_gap.gap_ratio;
  const projectedRedemptions = Math.max(
    2,
    Math.round(merchant.inventory_goal.target_redemptions * (merchant.demand_gap.triggers_demand_gap ? 0.86 : 0.42)),
  );
  return {
    ...merchant,
    queueState: merchant.autopilot_rule_hints.approved ? "approved" : "suggested",
    recommendation: pickRecommendation(merchant),
    projectedRedemptions,
    spent: Math.min(
      merchant.offer_budget.total_budget_eur,
      projectedRedemptions * merchant.offer_budget.max_cashback_eur * (0.35 + index * 0.08),
    ),
    acceptance: Math.min(76, Math.max(18, Math.round(24 + gap * 68 + index * 3))),
  };
});

function App() {
  const [drafts, setDrafts] = useState(initialDrafts);
  const [selectedId, setSelectedId] = useState(initialDrafts[0]?.id ?? "");
  const [autopilot, setAutopilot] = useState(true);
  const selected = drafts.find((draft) => draft.id === selectedId) ?? drafts[0];

  const totals = useMemo(() => {
    const approved = drafts.filter((draft) => draft.queueState === "approved");
    const surfaced = approved.reduce((sum, draft) => sum + draft.projectedRedemptions * 9, 0);
    const redeemed = approved.reduce((sum, draft) => sum + draft.projectedRedemptions, 0);
    const spent = approved.reduce((sum, draft) => sum + draft.spent, 0);
    const budget = drafts.reduce((sum, draft) => sum + draft.offer_budget.total_budget_eur, 0);
    return { approved: approved.length, surfaced, redeemed, spent, budget };
  }, [drafts]);

  function setQueueState(id: string, queueState: QueueState) {
    setDrafts((items) => items.map((item) => (item.id === id ? { ...item, queueState } : item)));
  }

  return (
    <main className="draft-shell">
      <header className="draft-topbar">
        <div>
          <span className="draft-kicker">Merchant components</span>
          <h1>Useful proof surfaces for Cafe Bondi and nearby merchants</h1>
        </div>
        <div className="context-stack" aria-label="Demo context">
          <span>{fixture.city}</span>
          <span>{fixture.demo_context.weather_trigger.replace(/_/g, " ")}</span>
          <span>{formatTime(fixture.demo_context.demo_time_local)}</span>
        </div>
      </header>

      <section className="metric-strip" aria-label="Pilot metrics">
        <Metric label="Approved" value={String(totals.approved)} detail="auto + manual" />
        <Metric label="Surfaced" value={String(totals.surfaced)} detail="wallet impressions" />
        <Metric label="Redeemed" value={String(totals.redeemed)} detail="projected next 90m" />
        <Metric label="Budget left" value={euro(totals.budget - totals.spent)} detail={`${euro(totals.spent)} paced`} />
      </section>

      <section className="draft-grid">
        <OpportunityQueue
          drafts={drafts}
          selectedId={selected.id}
          onSelect={setSelectedId}
          onStateChange={setQueueState}
        />
        <DemandGapPanel merchant={selected} />
        <AutopilotPanel merchant={selected} enabled={autopilot} onToggle={() => setAutopilot((value) => !value)} />
        <BudgetPacingPanel drafts={drafts} selected={selected} />
        <CityPulsePanel drafts={drafts} onSelect={setSelectedId} />
        <ActivityPanel drafts={drafts} />
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

function OpportunityQueue({
  drafts,
  selectedId,
  onSelect,
  onStateChange,
}: {
  drafts: MerchantDraft[];
  selectedId: string;
  onSelect: (id: string) => void;
  onStateChange: (id: string, state: QueueState) => void;
}) {
  return (
    <section className="panel queue-panel">
      <div className="panel-head">
        <div>
          <span className="draft-kicker">Component A</span>
          <h2>Offer command queue</h2>
        </div>
        <span className="panel-count">{drafts.length}</span>
      </div>
      <div className="queue-list">
        {drafts.map((draft) => (
          <article
            key={draft.id}
            className={`queue-row ${draft.id === selectedId ? "is-selected" : ""}`}
            onClick={() => onSelect(draft.id)}
          >
            <button type="button" className="queue-main" onClick={() => onSelect(draft.id)}>
              <span className={`status-dot is-${draft.queueState}`} />
              <span>
                <strong>{draft.display_name}</strong>
                <small>{draft.recommendation}</small>
              </span>
            </button>
            <div className="queue-actions" aria-label={`${draft.display_name} actions`}>
              <button type="button" title="Approve" onClick={() => onStateChange(draft.id, "approved")}>
                ✓
              </button>
              <button type="button" title="Reject" onClick={() => onStateChange(draft.id, "rejected")}>
                ×
              </button>
            </div>
            <div className="queue-meta">
              <span>{percent(draft.demand_gap.gap_ratio)} gap</span>
              <span>{draft.distance_m} m</span>
              <span>{euro(draft.offer_budget.max_cashback_eur)} each</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function DemandGapPanel({ merchant }: { merchant: MerchantDraft }) {
  return (
    <section className="panel demand-panel">
      <div className="panel-head">
        <div>
          <span className="draft-kicker">Component B</span>
          <h2>Demand-gap evidence</h2>
        </div>
        <span className={`trigger-pill ${merchant.demand_gap.triggers_demand_gap ? "is-hot" : ""}`}>
          {merchant.demand_gap.status.replace(/_/g, " ")}
        </span>
      </div>
      <div className="chart-wrap">
        <DensityChart merchant={merchant} />
      </div>
      <div className="gap-readout">
        <strong>{merchant.display_name}</strong>
        <span>
          Live is {percent(merchant.demand_gap.gap_ratio)} below the usual Saturday curve at 13:30.
        </span>
      </div>
      <div className="evidence-row">
        <Evidence label="Typical" value={String(merchant.demand_gap.typical_density)} />
        <Evidence label="Live" value={String(merchant.demand_gap.live_density)} />
        <Evidence label="Gap" value={String(merchant.demand_gap.gap_density_points)} />
      </div>
    </section>
  );
}

function AutopilotPanel({
  merchant,
  enabled,
  onToggle,
}: {
  merchant: MerchantDraft;
  enabled: boolean;
  onToggle: () => void;
}) {
  return (
    <section className="panel rule-panel">
      <div className="panel-head">
        <div>
          <span className="draft-kicker">Component C</span>
          <h2>Autopilot rule card</h2>
        </div>
        <button type="button" className={`toggle ${enabled ? "is-on" : ""}`} onClick={onToggle} aria-pressed={enabled}>
          <span />
        </button>
      </div>
      <code>{merchant.autopilot_rule_hints.rule_id}</code>
      <div className="condition-stack">
        {merchant.autopilot_rule_hints.conditions.map((condition) => (
          <span key={condition}>{condition}</span>
        ))}
      </div>
      <div className="generated-offer">
        <span>Generated copy</span>
        <strong>{merchant.autopilot_rule_hints.surface_copy_hint}</strong>
      </div>
      <div className="rule-footer">
        <span>{enabled ? "Auto-approve matching moments" : "Manual review required"}</span>
        <strong>{merchant.inventory_goal.target_redemptions} target redemptions</strong>
      </div>
    </section>
  );
}

function BudgetPacingPanel({ drafts, selected }: { drafts: MerchantDraft[]; selected: MerchantDraft }) {
  const selectedUsed = (selected.spent / selected.offer_budget.total_budget_eur) * 100;
  return (
    <section className="panel budget-panel">
      <div className="panel-head">
        <div>
          <span className="draft-kicker">Component D</span>
          <h2>Budget pacing</h2>
        </div>
        <span className="trigger-pill">{selected.display_name.split(" ")[0]}</span>
      </div>
      <div className="budget-hero">
        <span>Remaining</span>
        <strong>{euro(selected.offer_budget.total_budget_eur - selected.spent)}</strong>
        <small>
          {euro(selected.spent)} of {euro(selected.offer_budget.total_budget_eur)}
        </small>
      </div>
      <div className="budget-bar">
        <span style={{ width: `${Math.min(100, selectedUsed)}%` }} />
      </div>
      <div className="budget-ladder">
        {drafts.map((draft) => (
          <div key={draft.id}>
            <span>{draft.display_name}</span>
            <strong>{euro(draft.spent)}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}

function CityPulsePanel({ drafts, onSelect }: { drafts: MerchantDraft[]; onSelect: (id: string) => void }) {
  return (
    <section className="panel pulse-panel">
      <div className="panel-head">
        <div>
          <span className="draft-kicker">Component E</span>
          <h2>City pulse ranking</h2>
        </div>
      </div>
      <div className="pulse-table">
        {drafts
          .slice()
          .sort((a, b) => b.demand_gap.gap_ratio - a.demand_gap.gap_ratio)
          .map((draft, index) => (
            <button type="button" key={draft.id} onClick={() => onSelect(draft.id)}>
              <span className="rank">{index + 1}</span>
              <span className="pulse-name">
                <strong>{draft.display_name}</strong>
                <small>{draft.trigger_tags.slice(0, 3).join(" · ")}</small>
              </span>
              <span className="heat" aria-hidden>
                <span style={{ width: `${Math.max(8, draft.demand_gap.gap_ratio * 100)}%` }} />
              </span>
              <strong>{percent(draft.demand_gap.gap_ratio)}</strong>
            </button>
          ))}
      </div>
    </section>
  );
}

function ActivityPanel({ drafts }: { drafts: MerchantDraft[] }) {
  const rows = [
    { t: "13:31", label: "Auto-approved", merchant: drafts[0], tone: "good" },
    { t: "13:30", label: "Demand gap crossed", merchant: drafts[0], tone: "warn" },
    { t: "13:28", label: "Rain trigger updated", merchant: drafts[2], tone: "rain" },
    { t: "13:24", label: "Manual review opened", merchant: drafts[1], tone: "neutral" },
  ];
  return (
    <section className="panel activity-panel">
      <div className="panel-head">
        <div>
          <span className="draft-kicker">Component F</span>
          <h2>Activity feed</h2>
        </div>
      </div>
      <div className="activity-list">
        {rows.map((row) => (
          <article key={`${row.t}-${row.label}`}>
            <time>{row.t}</time>
            <span className={`activity-dot is-${row.tone}`} />
            <div>
              <strong>{row.label}</strong>
              <small>{row.merchant.display_name} · {row.merchant.autopilot_rule_hints.rule_id}</small>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function DensityChart({ merchant }: { merchant: MerchantDraft }) {
  const typical = merchant.typical_density_curve.points.map((point) => point.density);
  const live = merchant.live_samples.map((point) => point.density);
  const all = [...typical, ...live];
  const max = Math.max(...all, 100);
  const min = Math.min(0, ...all);
  const width = 460;
  const height = 180;
  const padding = 18;
  const typicalPath = makePath(typical, width, height, padding, min, max);
  const livePath = makePath(live, width, height, padding, min, max);
  const markerX = padding + ((width - padding * 2) * 2) / Math.max(1, live.length - 1);
  const markerY = yFor(merchant.demand_gap.live_density, height, padding, min, max);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Typical versus live demand density">
      <defs>
        <linearGradient id="gapFill" x1="0" x2="1">
          <stop offset="0%" stopColor="#e0542f" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#a75c28" stopOpacity="0.06" />
        </linearGradient>
      </defs>
      <path d="M18 142 C120 116 182 38 294 42 C360 44 404 72 442 94" fill="none" stroke="#d9c6a8" strokeWidth="18" strokeLinecap="round" opacity="0.55" />
      <path d={`${typicalPath} L442 162 L18 162 Z`} fill="url(#gapFill)" opacity="0.42" />
      <path d={typicalPath} fill="none" stroke="#80624b" strokeWidth="4" strokeLinecap="round" />
      <path d={livePath} fill="none" stroke="#e0542f" strokeWidth="5" strokeLinecap="round" />
      <line x1={markerX} y1="20" x2={markerX} y2="160" stroke="#1d1814" strokeDasharray="4 8" opacity="0.34" />
      <circle cx={markerX} cy={markerY} r="7" fill="#e0542f" />
      <text x="22" y="24">typical</text>
      <text x="22" y="48" className="live-label">live</text>
      <text x={markerX + 12} y={markerY - 10} className="gap-label">13:30 gap</text>
    </svg>
  );
}

function Evidence({ label, value }: { label: string; value: string }) {
  return (
    <span>
      <small>{label}</small>
      <strong>{value}</strong>
    </span>
  );
}

function makePath(values: number[], width: number, height: number, padding: number, min: number, max: number) {
  const points = values.map((value, index) => {
    const x = padding + ((width - padding * 2) * index) / Math.max(1, values.length - 1);
    const y = yFor(value, height, padding, min, max);
    return `${index === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
  });
  return points.join(" ");
}

function yFor(value: number, height: number, padding: number, min: number, max: number) {
  const ratio = (value - min) / Math.max(1, max - min);
  return height - padding - ratio * (height - padding * 2);
}

function pickRecommendation(merchant: Merchant) {
  if (merchant.demand_gap.triggers_demand_gap && merchant.trigger_tags.includes("rain_incoming")) {
    return "Fire rain + demand recovery offer";
  }
  if (merchant.trigger_tags.includes("browse_indoor")) {
    return "Hold for leisure-browse intent";
  }
  return "Keep monitoring";
}

function euro(amount: number) {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: fixture.currency,
    maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
  }).format(amount);
}

function percent(value: number) {
  return new Intl.NumberFormat("en", {
    style: "percent",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatTime(value: string) {
  return value.slice(11, 16);
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
