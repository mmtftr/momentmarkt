import type { ExtractedMenu, LimitsBody } from "../api/onboardingApi";

type Props = {
  menu: ExtractedMenu;
  value: LimitsBody;
  onChange: (next: LimitsBody) => void;
};

const DEFAULT_RULES = [
  { id: "rain_hot_drink", label: "Rain + a hot-drink category → auto-approve" },
  { id: "demand_gap_lunch", label: "Demand gap during lunch → auto-approve" },
];

export function LimitsPanel({ menu, value, onChange }: Props) {
  const toggleCategory = (id: string) => {
    const next = value.categories.includes(id)
      ? value.categories.filter((c) => c !== id)
      : [...value.categories, id];
    onChange({ ...value, categories: next });
  };

  const setFloor = (n: number) => {
    onChange({ ...value, discount_floor: Math.min(n, value.discount_ceiling - 1) });
  };
  const setCeiling = (n: number) => {
    onChange({ ...value, discount_ceiling: Math.max(n, value.discount_floor + 1) });
  };

  const toggleRule = (id: string) => {
    const next = value.auto_approve_rules.includes(id)
      ? value.auto_approve_rules.filter((r) => r !== id)
      : [...value.auto_approve_rules, id];
    onChange({ ...value, auto_approve_rules: next });
  };

  const fillPct = (n: number) => `${Math.min(100, Math.max(0, n * 2))}%`;

  return (
    <div className="ob-limits">
      <article className="ob-card">
        <h2>Allowed categories</h2>
        <p className="ob-muted">Only items in these categories can appear in offers.</p>
        <div className="chip-row">
          {menu.categories.map((c) => {
            const on = value.categories.includes(c.id);
            return (
              <button
                key={c.id}
                type="button"
                className={`chip ${on ? "is-on" : ""}`}
                onClick={() => toggleCategory(c.id)}
                aria-pressed={on}
              >
                {c.label}
              </button>
            );
          })}
        </div>
      </article>

      <article className="ob-card">
        <h2>Discount range</h2>
        <p className="ob-muted">
          The lowest you'd ever start at, and the highest you'd ever go.
        </p>

        <div className="ob-slider-row">
          <div className="ob-slider-row-head">
            <strong>Floor</strong>
            <span className="ob-slider-value tone-cocoa">{value.discount_floor}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={50}
            step={1}
            value={value.discount_floor}
            onChange={(e) => setFloor(Number(e.target.value))}
            className="slider tone-cocoa"
          />
        </div>

        <div className="ob-slider-row">
          <div className="ob-slider-row-head">
            <strong>Ceiling</strong>
            <span className="ob-slider-value tone-spark">{value.discount_ceiling}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={50}
            step={1}
            value={value.discount_ceiling}
            onChange={(e) => setCeiling(Number(e.target.value))}
            className="slider tone-spark"
          />
        </div>

        <div className="bounds-band" aria-hidden>
          <span
            className="bounds-band-fill"
            style={{
              left: fillPct(value.discount_floor),
              width: fillPct(value.discount_ceiling - value.discount_floor),
            }}
          />
          <span className="bounds-band-label" style={{ left: fillPct(value.discount_floor) }}>
            {value.discount_floor}%
          </span>
          <span className="bounds-band-label" style={{ left: fillPct(value.discount_ceiling) }}>
            {value.discount_ceiling}%
          </span>
        </div>
      </article>

      <article className="ob-card">
        <h2>Auto-approve</h2>
        <label className="ob-toggle">
          <input
            type="checkbox"
            checked={value.auto_approve}
            onChange={(e) => onChange({ ...value, auto_approve: e.target.checked })}
          />
          <span>Approve drafts that match a trusted rule</span>
        </label>

        {value.auto_approve ? (
          <ul className="ob-rule-list">
            {DEFAULT_RULES.map((r) => {
              const on = value.auto_approve_rules.includes(r.id);
              return (
                <li key={r.id}>
                  <label>
                    <input type="checkbox" checked={on} onChange={() => toggleRule(r.id)} />
                    <span>{r.label}</span>
                  </label>
                </li>
              );
            })}
          </ul>
        ) : null}
      </article>
    </div>
  );
}
