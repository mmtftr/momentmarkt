/*
 * Settings — payment binding, notification prefs, audit retention, team. All
 * cosmetic for the hackathon mockup; real wiring lives in the v2 portal.
 */

import { useState } from "react";

const TEAM = [
  { name: "Esra Kaya", role: "Owner", email: "esra@cafe-bondi.de", initial: "E" },
  { name: "Niklas Brandt", role: "Manager", email: "niklas@cafe-bondi.de", initial: "N" },
  { name: "Lucia Albers", role: "Barista (read-only)", email: "lucia@cafe-bondi.de", initial: "L" },
];

export function SettingsSection() {
  const [notifAccepted, setNotifAccepted] = useState(true);
  const [notifRedeemed, setNotifRedeemed] = useState(true);
  const [notifBudgetLow, setNotifBudgetLow] = useState(true);
  const [notifNegotiation, setNotifNegotiation] = useState(false);
  const [retention, setRetention] = useState("90");

  return (
    <div className="section-body">
      <header className="section-head">
        <div className="section-head-text">
          <span className="eyebrow">Settings</span>
          <h1>Account, notifications, and team</h1>
          <p className="lead">
            Sparkasse account binding, notification preferences, audit retention, and team
            access. Most of this is cosmetic for the hackathon — the full settings surface
            ships with the v2 merchant portal.
          </p>
        </div>
      </header>

      <section className="settings-grid">
        <article className="settings-card">
          <h2>Sparkasse account binding</h2>
          <p className="bounds-help">
            Cashback redemptions settle into this account on T+1.
          </p>
          <div className="binding-row">
            <div className="binding-meta">
              <span className="binding-bank">Berliner Sparkasse</span>
              <code>DE89 ••• ••• ••• 4521</code>
              <small>Bound 2026-04-12 · OAuth via Sparkassen-Finanzportal</small>
            </div>
            <button type="button" className="ghost-button">Re-bind</button>
          </div>
        </article>

        <article className="settings-card">
          <h2>Notification preferences</h2>
          <p className="bounds-help">
            Email + push when these events fire under your bounds.
          </p>
          <ToggleRow
            label="Offer accepted"
            sublabel="A customer saved a generated offer to their wallet"
            value={notifAccepted}
            onChange={setNotifAccepted}
          />
          <ToggleRow
            label="Offer redeemed"
            sublabel="A customer scanned the QR at the counter"
            value={notifRedeemed}
            onChange={setNotifRedeemed}
          />
          <ToggleRow
            label="Daily budget &lt; 20%"
            sublabel="So you can decide whether to top-up before peak hours"
            value={notifBudgetLow}
            onChange={setNotifBudgetLow}
          />
          <ToggleRow
            label="Negotiation Agent escalation"
            sublabel="When a discount is auto-pushed near your ceiling (v2)"
            value={notifNegotiation}
            onChange={setNotifNegotiation}
          />
        </article>

        <article className="settings-card">
          <h2>Audit log retention</h2>
          <p className="bounds-help">
            How long generations stay in your audit log before being hashed-only.
          </p>
          <select
            className="retention-select"
            value={retention}
            onChange={(e) => setRetention(e.target.value)}
          >
            <option value="30">30 days</option>
            <option value="90">90 days (recommended)</option>
            <option value="180">180 days</option>
            <option value="365">365 days (Sparkasse maximum)</option>
          </select>
          <small className="retention-hint">
            Per Sparkassen data policy, retention beyond 365 days requires written merchant
            request.
          </small>
        </article>

        <article className="settings-card settings-card-wide">
          <h2>Team members</h2>
          <p className="bounds-help">
            Who can read this dashboard and modify your bounds.
          </p>
          <ul className="team-list">
            {TEAM.map((member) => (
              <li key={member.email} className="team-row">
                <span className="team-avatar">{member.initial}</span>
                <div className="team-meta">
                  <strong>{member.name}</strong>
                  <small>{member.email}</small>
                </div>
                <span className="team-role">{member.role}</span>
              </li>
            ))}
          </ul>
          <button type="button" className="ghost-button">+ Invite teammate</button>
        </article>
      </section>

      <footer className="section-foot">
        <span className="foot-meta">
          Merchant ID <code>berlin-mitte-cafe-bondi</code> · plan: <strong>City Pilot</strong>
        </span>
        <button type="button" className="primary-button">Save changes</button>
      </footer>
    </div>
  );
}

function ToggleRow({
  label,
  sublabel,
  value,
  onChange,
}: {
  label: string;
  sublabel: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="toggle-row">
      <div>
        <strong dangerouslySetInnerHTML={{ __html: label }} />
        <small>{sublabel}</small>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={value}
        className={`toggle ${value ? "is-on" : ""}`}
        onClick={() => onChange(!value)}
      >
        <span className="toggle-knob" />
      </button>
    </label>
  );
}
