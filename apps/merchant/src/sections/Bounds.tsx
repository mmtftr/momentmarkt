/*
 * Bounds — the merchant's contract with the LLM. Mockup for v2 (POST endpoint
 * not wired). Captures: discount floor / ceiling sliders, allowed categories,
 * opening hours / blackout windows, brand tone. Save button is cosmetic.
 *
 * Per issue #138: "Bounds Manager" agent — the merchant authors no offer copy
 * at all; instead they set bounds and the LLM generates within them.
 */

import { useState } from "react";

const CATEGORIES = [
  { id: "cafe", label: "Café", active: true },
  { id: "bakery", label: "Bakery", active: true },
  { id: "kiosk", label: "Kiosk", active: false },
  { id: "bar", label: "Bar", active: false },
  { id: "restaurant", label: "Restaurant", active: false },
  { id: "bookstore", label: "Bookstore", active: false },
];

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function BoundsSection() {
  const [floor, setFloor] = useState(5);
  const [ceiling, setCeiling] = useState(25);
  const [cats, setCats] = useState(() => CATEGORIES.filter((c) => c.active).map((c) => c.id));
  const [openTime, setOpenTime] = useState("08:00");
  const [closeTime, setCloseTime] = useState("18:00");
  const [blackoutStart, setBlackoutStart] = useState("12:00");
  const [blackoutEnd, setBlackoutEnd] = useState("13:00");
  const [tone, setTone] = useState("Polite, no urgency language. Mention Berlin neighbourhood warmth where it fits.");

  return (
    <div className="section-body">
      <header className="section-head">
        <div className="section-head-text">
          <span className="eyebrow">Bounds</span>
          <h1>Your contract with the LLM</h1>
          <p className="lead">
            You don't author offer copy. You set the worst-case discount you'd tolerate, the
            categories you participate in, and the windows you're open. The LLM generates
            every offer in real time inside these bounds — never below your floor, never
            above your ceiling, never outside your hours.
          </p>
        </div>
      </header>

      <section className="bounds-grid">
        <article className="bounds-card">
          <h2>Discount range</h2>
          <p className="bounds-help">
            Floor is the smallest discount we'll start at. Ceiling is the largest we'll ever
            tolerate, even after Negotiation Agent escalation.
          </p>

          <SliderRow
            label="Floor"
            sublabel="smallest discount we'll start at"
            value={floor}
            min={0}
            max={20}
            onChange={(v) => setFloor(Math.min(v, ceiling - 1))}
            tone="cocoa"
          />

          <SliderRow
            label="Ceiling"
            sublabel="largest we'll tolerate (Negotiation Agent cap)"
            value={ceiling}
            min={5}
            max={50}
            onChange={(v) => setCeiling(Math.max(v, floor + 1))}
            tone="spark"
          />

          <div className="bounds-band" aria-hidden>
            <span
              className="bounds-band-fill"
              style={{
                left: `${(floor / 50) * 100}%`,
                width: `${((ceiling - floor) / 50) * 100}%`,
              }}
            />
            <span className="bounds-band-label" style={{ left: `${(floor / 50) * 100}%` }}>
              {floor}%
            </span>
            <span className="bounds-band-label" style={{ left: `${(ceiling / 50) * 100}%` }}>
              {ceiling}%
            </span>
          </div>
        </article>

        <article className="bounds-card">
          <h2>Allowed categories</h2>
          <p className="bounds-help">
            The LLM only generates offers for categories you've opted into.
          </p>
          <div className="chip-row">
            {CATEGORIES.map((c) => {
              const on = cats.includes(c.id);
              return (
                <button
                  key={c.id}
                  type="button"
                  className={`chip ${on ? "is-on" : ""}`}
                  onClick={() =>
                    setCats((current) =>
                      on ? current.filter((id) => id !== c.id) : [...current, c.id],
                    )
                  }
                >
                  {c.label}
                </button>
              );
            })}
          </div>
        </article>

        <article className="bounds-card">
          <h2>Opening hours</h2>
          <p className="bounds-help">
            Outside this window, the Opportunity Agent will not fire offers for you.
          </p>
          <div className="time-row">
            <label className="time-field">
              <span>Open</span>
              <input type="time" value={openTime} onChange={(e) => setOpenTime(e.target.value)} />
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
            {DAYS.map((d) => (
              <span key={d} className={`day-pill ${d === "Sun" ? "is-off" : ""}`}>
                {d}
              </span>
            ))}
          </div>
        </article>

        <article className="bounds-card">
          <h2>Blackout window</h2>
          <p className="bounds-help">
            Hours where you're full and don't want surfaces fired (e.g. peak lunch).
          </p>
          <div className="time-row">
            <label className="time-field">
              <span>Start</span>
              <input
                type="time"
                value={blackoutStart}
                onChange={(e) => setBlackoutStart(e.target.value)}
              />
            </label>
            <span className="time-dash">—</span>
            <label className="time-field">
              <span>End</span>
              <input
                type="time"
                value={blackoutEnd}
                onChange={(e) => setBlackoutEnd(e.target.value)}
              />
            </label>
          </div>
        </article>

        <article className="bounds-card bounds-card-wide">
          <h2>Brand tone</h2>
          <p className="bounds-help">
            Free-text guidance the LLM weaves into every generated headline. Keep it short.
          </p>
          <textarea
            className="bounds-textarea"
            value={tone}
            onChange={(e) => setTone(e.target.value)}
            rows={3}
          />
        </article>
      </section>

      <footer className="section-foot">
        <span className="foot-meta">
          Last saved: <strong>2026-04-25 11:08</strong> · 4 offer generations under these
          bounds today
        </span>
        <button type="button" className="primary-button" onClick={() => undefined}>
          Save bounds
        </button>
      </footer>
    </div>
  );
}

function SliderRow({
  label,
  sublabel,
  value,
  min,
  max,
  onChange,
  tone,
}: {
  label: string;
  sublabel: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
  tone: "cocoa" | "spark";
}) {
  return (
    <div className="slider-row">
      <div className="slider-row-head">
        <div>
          <strong>{label}</strong>
          <small>{sublabel}</small>
        </div>
        <span className={`slider-value tone-${tone}`}>{value}%</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className={`slider tone-${tone}`}
      />
    </div>
  );
}
