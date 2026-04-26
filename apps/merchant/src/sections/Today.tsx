/*
 * Today — the only fully wired section. Hosts the Moments feed (left rail of
 * the inbox grid) and the detail panel (signal evidence → customer-widget
 * mirror → live counters → matched rule). Polls /merchants/{id}/summary every
 * 2s through useMerchantStats.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { WidgetRenderer } from "../genui/WidgetRenderer";
import {
  approvalRule,
  euro,
  MERCHANT_ID,
  merchantFixture as merchant,
  type Moment,
  type MerchantPollState,
  offersToMoments,
  percent,
  shortTime,
  STATUS_LABELS,
  totalBudget,
  useMerchantStats,
} from "../data/merchantStats";

export function TodaySection() {
  const poll = useMerchantStats(MERCHANT_ID, 2000);
  const moments = useMemo(() => offersToMoments(poll.stats), [poll.stats]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selected =
    moments.find((m) => m.id === selectedId) ?? moments[0] ?? null;

  useEffect(() => {
    if (selected && selected.id !== selectedId) {
      setSelectedId(selected.id);
    }
  }, [selected, selectedId]);

  const totals = poll.stats ?? null;
  const surfaced = totals?.surfaced ?? 0;
  const redeemed = totals?.redeemed ?? selected?.redemptions ?? 0;
  const accepted = Math.max(redeemed, totals?.offer_count ?? 1);
  const budgetTotal = totals?.budget_total || selected?.budgetTotal || totalBudget;
  const budgetSpent = totals?.budget_spent ?? selected?.budgetSpent ?? 0;
  const remaining = Math.max(0, budgetTotal - budgetSpent);
  const budgetUsedPct = budgetTotal
    ? Math.min(100, Math.round((budgetSpent / budgetTotal) * 100))
    : 0;

  return (
    <div className="section-body">
      <SectionHeader
        eyebrow="Today"
        title="Live moments at Cafe Bondi"
        lead="Every active offer the LLM has fired under your bounds, with the customer-side widget rendered byte-for-byte from the same GenUI JSON."
        right={<TodaySummaryPills poll={poll} surfaced={surfaced} redeemed={redeemed} />}
      />

      <section className="inbox">
        <Feed moments={moments} selectedId={selected?.id ?? null} onSelect={setSelectedId} />

        <div className="detail">
          {selected ? (
            <>
              <SignalEvidence />
              <MirrorSection moment={selected} />
              <CountersSection
                surfaced={surfaced}
                accepted={accepted}
                redeemed={redeemed}
                remaining={remaining}
                budgetSpent={budgetSpent}
                budgetTotal={budgetTotal}
                budgetUsedPct={budgetUsedPct}
              />
              <MatchedRule />
            </>
          ) : null}
        </div>
      </section>
    </div>
  );
}

function SectionHeader({
  eyebrow,
  title,
  lead,
  right,
}: {
  eyebrow: string;
  title: string;
  lead?: string;
  right?: React.ReactNode;
}) {
  return (
    <header className="section-head">
      <div className="section-head-text">
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        {lead ? <p className="lead">{lead}</p> : null}
      </div>
      {right ? <div className="section-head-right">{right}</div> : null}
    </header>
  );
}

function TodaySummaryPills({
  poll,
  surfaced,
  redeemed,
}: {
  poll: MerchantPollState;
  surfaced: number;
  redeemed: number;
}) {
  const live = Boolean(poll.stats && !poll.error);
  return (
    <div className="head-pills">
      <span className={`head-pill ${live ? "is-live" : "is-fixture"}`}>
        <span className="head-pill-dot" />
        {live ? "Live" : "Fixture"}
      </span>
      <span className="head-pill is-muted">
        <strong>{surfaced}</strong>&nbsp;surfaced
      </span>
      <span className="head-pill is-muted">
        <strong>{redeemed}</strong>&nbsp;redeemed
      </span>
    </div>
  );
}

function Feed({
  moments,
  selectedId,
  onSelect,
}: {
  moments: Moment[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <aside className="feed" aria-label="Moments feed">
      <div className="feed-heading">
        <span className="eyebrow">Moments</span>
        <span className="count">{moments.length}</span>
      </div>
      {moments.map((moment) => (
        <FeedCard
          key={moment.id}
          moment={moment}
          isSelected={moment.id === selectedId}
          onClick={() => onSelect(moment.id)}
        />
      ))}
    </aside>
  );
}

function FeedCard({
  moment,
  isSelected,
  onClick,
}: {
  moment: Moment;
  isSelected: boolean;
  onClick: () => void;
}) {
  const status = STATUS_LABELS[moment.status];
  const used = moment.budgetTotal
    ? Math.min(100, Math.round((moment.budgetSpent / moment.budgetTotal) * 100))
    : 0;
  const previousRedemptions = useRef(moment.redemptions);
  const [pulseKey, setPulseKey] = useState(0);
  useEffect(() => {
    if (previousRedemptions.current !== moment.redemptions) {
      previousRedemptions.current = moment.redemptions;
      setPulseKey((k) => k + 1);
    }
  }, [moment.redemptions]);

  return (
    <button
      type="button"
      className={`feed-card ${isSelected ? "is-selected" : ""}`}
      onClick={onClick}
      key={pulseKey}
    >
      <span className={`feed-status-dot ${status.dotClass}`} aria-hidden />
      <div className="feed-card-body">
        <div className="feed-card-topline">
          <span>{shortTime(moment.expiresAt)} expiry</span>
          <span>{moment.source === "fixture" ? "Fixture" : "Live"}</span>
        </div>
        <h3>{moment.headline}</h3>
        <p className="trigger">{moment.triggerLine}</p>
        <div className="feed-card-foot">
          <span className={`feed-pill ${status.pillClass}`}>{status.label}</span>
          <span className="feed-bar" aria-hidden>
            <span style={{ width: `${used}%` }} />
          </span>
          <span className="feed-bar-meta">
            {moment.redemptions}/
            {Math.max(
              1,
              Math.round(moment.budgetTotal / Math.max(moment.cashbackPerRedeem, 1)),
            )}
          </span>
        </div>
      </div>
    </button>
  );
}

function SignalEvidence() {
  return (
    <section className="detail-section" aria-label="Signal evidence">
      <span className="section-eyebrow">Signal evidence</span>
      <h2>Why this moment fired</h2>
      <p className="lead">
        Three signals crossed for {merchant.display_name} at 13:30 — the rule that watches
        rain + demand gap auto-approved without merchant review.
      </p>
      <div className="signal-row">
        <article className="signal-chip is-rain">
          <span className="label">Weather</span>
          <strong>Rain incoming</strong>
        </article>
        <article className="signal-chip is-spark">
          <span className="label">Demand gap</span>
          <strong>{percent(merchant.demand_gap.gap_ratio)} below usual</strong>
        </article>
        <article className="signal-chip is-cocoa">
          <span className="label">Distance</span>
          <strong>{merchant.distance_m} m from Mia</strong>
        </article>
      </div>
    </section>
  );
}

function MirrorSection({ moment }: { moment: Moment }) {
  return (
    <section className="detail-section detail-mirror" aria-label="Customer widget mirror">
      <div className="mirror-copy">
        <span className="section-eyebrow">What Mia sees</span>
        <h2>Same widget, same moment.</h2>
        <p className="lead">
          The merchant inbox renders the customer widget from the same GenUI JSON the wallet
          consumes — what's approved here is what surfaces in Mia's pocket, byte-for-byte.
        </p>
        <p className="lead">
          <strong style={{ color: "var(--cocoa)" }}>{moment.headline}</strong> — expires{" "}
          {shortTime(moment.expiresAt)}.
        </p>
      </div>
      <div className="phone-frame" aria-hidden>
        <div className="phone-frame-screen">
          <WidgetRenderer node={moment.widgetSpec} />
        </div>
      </div>
    </section>
  );
}

function CountersSection({
  surfaced,
  accepted,
  redeemed,
  remaining,
  budgetSpent,
  budgetTotal,
  budgetUsedPct,
}: {
  surfaced: number;
  accepted: number;
  redeemed: number;
  remaining: number;
  budgetSpent: number;
  budgetTotal: number;
  budgetUsedPct: number;
}) {
  return (
    <section className="detail-section" aria-label="Live counters">
      <span className="section-eyebrow">Live counters</span>
      <h2>Surfaced → accepted → redeemed.</h2>
      <p className="lead">Polls /merchants/{MERCHANT_ID}/summary every 2s.</p>
      <div className="counter-grid">
        <Counter label="Surfaced" value={String(surfaced)} detail="nearby high-intent wallets" />
        <Counter label="Accepted" value={String(accepted)} detail="saved to wallet" />
        <Counter label="Redeemed" value={String(redeemed)} detail="QR scanned at counter" />
        <Counter
          label="Budget left"
          value={euro(remaining)}
          detail={`${euro(budgetSpent)} of ${euro(budgetTotal)}`}
        />
      </div>
      <div className="counter-budget-bar" aria-label={`${budgetUsedPct}% budget used`}>
        <span style={{ width: `${budgetUsedPct}%` }} />
      </div>
    </section>
  );
}

function Counter({ label, value, detail }: { label: string; value: string; detail: string }) {
  const previous = useRef(value);
  const [pulseKey, setPulseKey] = useState(0);
  useEffect(() => {
    if (previous.current !== value) {
      previous.current = value;
      setPulseKey((k) => k + 1);
    }
  }, [value]);
  return (
    <article className="counter">
      <span className="label">{label}</span>
      <strong key={pulseKey}>{value}</strong>
      <small>{detail}</small>
    </article>
  );
}

function MatchedRule() {
  return (
    <div className="matched-rule" aria-label="Matched autopilot rule">
      <div>
        <span className="label">Matched rule</span>
        <code>{approvalRule.rule_id}</code>
      </div>
      <ul className="conditions">
        {approvalRule.conditions.map((condition: string) => (
          <li key={condition}>{condition}</li>
        ))}
      </ul>
    </div>
  );
}
