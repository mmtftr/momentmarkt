type DayKey = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

const DAYS: { key: DayKey; label: string }[] = [
  { key: "mon", label: "Monday" },
  { key: "tue", label: "Tuesday" },
  { key: "wed", label: "Wednesday" },
  { key: "thu", label: "Thursday" },
  { key: "fri", label: "Friday" },
  { key: "sat", label: "Saturday" },
  { key: "sun", label: "Sunday" },
];

export type HoursMap = Record<DayKey, { open: string; close: string }[]>;

type Props = {
  hours: HoursMap;
  onChange: (next: HoursMap) => void;
};

const empty: HoursMap = { mon: [], tue: [], wed: [], thu: [], fri: [], sat: [], sun: [] };

export function HoursPicker({ hours, onChange }: Props) {
  const safe = { ...empty, ...hours };

  const setRange = (day: DayKey, idx: number, key: "open" | "close", value: string) => {
    const dayRanges = safe[day].slice();
    dayRanges[idx] = { ...dayRanges[idx], [key]: value };
    onChange({ ...safe, [day]: dayRanges });
  };

  const toggleClosed = (day: DayKey) => {
    if (safe[day].length === 0) {
      onChange({ ...safe, [day]: [{ open: "09:00", close: "18:00" }] });
    } else {
      onChange({ ...safe, [day]: [] });
    }
  };

  return (
    <div className="ob-hours">
      {DAYS.map(({ key, label }) => {
        const ranges = safe[key];
        const closed = ranges.length === 0;
        return (
          <div key={key} className={`ob-hours-row ${closed ? "is-closed" : ""}`}>
            <span className="ob-hours-day">{label}</span>
            {closed ? (
              <span className="ob-hours-closed">Closed</span>
            ) : (
              <div className="ob-hours-ranges">
                {ranges.map((r, idx) => (
                  <div key={idx} className="ob-hours-range">
                    <input
                      type="time"
                      value={r.open}
                      aria-label={`${label} open`}
                      onChange={(e) => setRange(key, idx, "open", e.target.value)}
                    />
                    <span aria-hidden>—</span>
                    <input
                      type="time"
                      value={r.close}
                      aria-label={`${label} close`}
                      onChange={(e) => setRange(key, idx, "close", e.target.value)}
                    />
                  </div>
                ))}
              </div>
            )}
            <button
              type="button"
              className="ob-link"
              onClick={() => toggleClosed(key)}
            >
              {closed ? "Open" : "Set closed"}
            </button>
          </div>
        );
      })}
    </div>
  );
}
