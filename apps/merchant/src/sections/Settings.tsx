/*
 * Settings — operational setup. Opening hours, account binding, notifications,
 * audit retention, team. Hours moved here from Bounds — they're shop facts,
 * not bounds on the assistant.
 */

import { useState } from "react";

const TEAM = [
  { name: "Esra Kaya", role: "Owner", email: "esra@cafe-bondi.de", initial: "E" },
  { name: "Niklas Brandt", role: "Manager", email: "niklas@cafe-bondi.de", initial: "N" },
  { name: "Lucia Albers", role: "Barista (read-only)", email: "lucia@cafe-bondi.de", initial: "L" },
];

const DAYS: { id: DayKey; label: string }[] = [
  { id: "mon", label: "Mon" },
  { id: "tue", label: "Tue" },
  { id: "wed", label: "Wed" },
  { id: "thu", label: "Thu" },
  { id: "fri", label: "Fri" },
  { id: "sat", label: "Sat" },
  { id: "sun", label: "Sun" },
];

type DayKey = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

type SettingsProps = {
  onResetOnboarding?: () => void;
};

export function SettingsSection({ onResetOnboarding }: SettingsProps = {}) {
  const [notifAccepted, setNotifAccepted] = useState(true);
  const [notifRedeemed, setNotifRedeemed] = useState(true);
  const [notifBudgetLow, setNotifBudgetLow] = useState(true);
  const [notifNegotiation, setNotifNegotiation] = useState(false);
  const [retention, setRetention] = useState("90");
  const [openTime, setOpenTime] = useState("08:00");
  const [closeTime, setCloseTime] = useState("18:00");
  const [closedDays, setClosedDays] = useState<DayKey[]>(["sun"]);

  return (
    <div className="section-body">
      <header className="section-head">
        <div className="section-head-text">
          <span className="eyebrow">Settings</span>
          <h1>Setup, account, and team</h1>
          <p className="lead">
            Opening hours, payout binding, notifications, and who can see this dashboard.
          </p>
        </div>
      </header>

      <section className="settings-grid">
        <article className="settings-card settings-card-wide">
          <h2>Opening hours</h2>
          <p className="bounds-help">
            Outside this window we won't fire any offers for you, and we'll skip any day you mark closed.
          </p>
          <div className="time-row">
            <label className="time-field">
              <span>Open</span>
              <input
                type="time"
                value={openTime}
                onChange={(e) => setOpenTime(e.target.value)}
              />
            </label>
            <span className="time-dash">—</span>
            <label className="time-field">
              <span>Close</span>
              <input
                type="time"
                value={closeTime}
                onChange={(e) => setCloseTime(e.target.value)}
              />
            </label>
          </div>
          <div className="day-row">
            {DAYS.map((d) => {
              const closed = closedDays.includes(d.id);
              return (
                <button
                  key={d.id}
                  type="button"
                  className={`day-pill ${closed ? "is-off" : "is-on"}`}
                  onClick={() =>
                    setClosedDays((current) =>
                      closed ? current.filter((x) => x !== d.id) : [...current, d.id],
                    )
                  }
                >
                  {d.label}
                </button>
              );
            })}
          </div>
        </article>

        <article className="settings-card">
          <h2>Payout account</h2>
          <p className="bounds-help">
            Cashback redemptions settle here on the next business day.
          </p>
          <div className="binding-row">
            <div className="binding-meta">
              <span className="binding-bank">Berliner Sparkasse</span>
              <code>DE89 ••• ••• ••• 4521</code>
              <small>Bound 2026-04-12</small>
            </div>
            <button type="button" className="ghost-button">Re-bind</button>
          </div>
        </article>

        <article className="settings-card">
          <h2>Notifications</h2>
          <p className="bounds-help">Email + push when these events fire.</p>
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
            label="Daily budget low (under 20%)"
            sublabel="Heads-up before peak hours"
            value={notifBudgetLow}
            onChange={setNotifBudgetLow}
          />
          <ToggleRow
            label="Discount near your ceiling"
            sublabel="When a generated discount is pushed close to your max"
            value={notifNegotiation}
            onChange={setNotifNegotiation}
          />
        </article>

        <article className="settings-card">
          <h2>History retention</h2>
          <p className="bounds-help">
            How long we keep generated offer copy in your history before it's hashed only.
          </p>
          <select
            className="retention-select"
            value={retention}
            onChange={(e) => setRetention(e.target.value)}
          >
            <option value="30">30 days</option>
            <option value="90">90 days (recommended)</option>
            <option value="180">180 days</option>
            <option value="365">365 days</option>
          </select>
        </article>

        <article className="settings-card settings-card-wide">
          <h2>Team</h2>
          <p className="bounds-help">Who can see this dashboard and edit your bounds.</p>
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

        {onResetOnboarding ? (
          <article className="settings-card settings-card-wide">
            <h2>Restart setup</h2>
            <p className="bounds-help">
              Re-run the onboarding flow if you want to re-import your menu or change your
              storefront details from scratch.
            </p>
            <button type="button" className="ghost-button" onClick={onResetOnboarding}>
              Re-run onboarding
            </button>
          </article>
        ) : null}
      </section>

      <footer className="section-foot">
        <span className="foot-meta">
          {merchantLine()}
        </span>
        <button type="button" className="primary-button">Save changes</button>
      </footer>
    </div>
  );
}

function merchantLine() {
  return "Cafe Bondi · Berlin Mitte · City Pilot plan";
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
        <strong>{label}</strong>
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
