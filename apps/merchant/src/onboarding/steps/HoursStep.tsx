import { useEffect, useState } from "react";
import { fetchHours, postHours, type HoursResponse } from "../api/onboardingApi";
import { DemandCurveChart } from "../components/DemandCurveChart";
import { HoursPicker, type HoursMap } from "../components/HoursPicker";

const EMPTY_HOURS: HoursMap = { mon: [], tue: [], wed: [], thu: [], fri: [], sat: [], sun: [] };

type DayKey = keyof HoursMap;

type Props = {
  onboardingId: string;
  onConfirm: (hours: HoursResponse) => void;
};

export function HoursStep({ onboardingId, onConfirm }: Props) {
  const [data, setData] = useState<HoursResponse | null>(null);
  const [hours, setHours] = useState<HoursMap>(EMPTY_HOURS);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [day, setDay] = useState<DayKey>("sat");

  useEffect(() => {
    let cancelled = false;
    fetchHours(onboardingId)
      .then((r) => {
        if (cancelled) return;
        setData(r);
        if (r.hours) {
          setHours({ ...EMPTY_HOURS, ...(r.hours as HoursMap) });
        }
        const fromCurve = r.demand_curve?.day_of_week?.toLowerCase().slice(0, 3);
        if (fromCurve && fromCurve in EMPTY_HOURS) setDay(fromCurve as DayKey);
      })
      .catch((err) => !cancelled && setError(err instanceof Error ? err.message : String(err)));
    return () => {
      cancelled = true;
    };
  }, [onboardingId]);

  const blackouts = (data?.blackouts ?? EMPTY_HOURS) as Record<DayKey, { start: string; end: string }[]>;
  const curveDayKey = (data?.demand_curve?.day_of_week ?? "sat").toLowerCase().slice(0, 3) as DayKey;

  const submit = async () => {
    setSaving(true);
    setError(null);
    try {
      await postHours(onboardingId, hours, blackouts);
      onConfirm({ ...(data as HoursResponse), hours, blackouts });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="ob-step ob-hours-step">
      <header className="ob-step-head">
        <span className="eyebrow">Hours and peak times</span>
        <h1>When are you open, and when are you already full?</h1>
        <p className="lead">
          We pulled your opening hours from Google Maps. Below, the curve shows your typical
          demand. The shaded windows are when you're already at capacity — we won't surface
          offers during those.
        </p>
      </header>

      <article className="ob-card">
        <h2>Opening hours</h2>
        <HoursPicker hours={hours} onChange={setHours} />
      </article>

      <article className="ob-card">
        <h2>Your demand pattern</h2>
        {data?.demand_curve ? (
          <DemandCurveChart
            curve={data.demand_curve}
            blackouts={blackouts}
            selectedDay={day}
            onDayChange={setDay}
            curveDay={curveDayKey}
          />
        ) : (
          <p className="ob-muted">Loading demand data…</p>
        )}
        {data?.demand_curve?.merchant_goal ? (
          <p className="ob-card-foot">
            Heads up: <em>{data.demand_curve.merchant_goal}</em>
          </p>
        ) : null}
      </article>

      {error ? <p className="ob-error" role="alert">{error}</p> : null}

      <footer className="ob-step-foot">
        <button type="button" className="primary-button" onClick={submit} disabled={saving}>
          {saving ? "Saving…" : "Confirm hours"}
        </button>
      </footer>
    </section>
  );
}
