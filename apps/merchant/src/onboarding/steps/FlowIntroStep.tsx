import { useState } from "react";
import { postLimits, type ExtractedMenu, type LimitsBody } from "../api/onboardingApi";
import { FlowDiagram } from "../components/FlowDiagram";
import { LimitsPanel } from "../components/LimitsPanel";

type Props = {
  onboardingId: string;
  menu: ExtractedMenu;
  onComplete: () => void;
};

const defaultLimits = (menu: ExtractedMenu): LimitsBody => ({
  categories: menu.categories.slice(0, Math.min(3, menu.categories.length)).map((c) => c.id),
  discount_floor: 5,
  discount_ceiling: 25,
  auto_approve: true,
  auto_approve_rules: ["rain_hot_drink"],
});

export function FlowIntroStep({ onboardingId, menu, onComplete }: Props) {
  const [limits, setLimits] = useState<LimitsBody>(() => defaultLimits(menu));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setSaving(true);
    setError(null);
    try {
      await postLimits(onboardingId, limits);
      onComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setSaving(false);
    }
  };

  return (
    <section className="ob-step ob-flow-step">
      <header className="ob-step-head">
        <span className="eyebrow">How it works</span>
        <h1>How MomentMarkt works for {menu.display_name ?? "your shop"}.</h1>
        <p className="lead">
          You set the limits — we handle the moments and the copy. Hover any step to see what
          happens behind the scenes.
        </p>
      </header>

      <FlowDiagram />

      <header className="ob-step-subhead">
        <h2>Your limits</h2>
        <p className="ob-muted">Pick the categories you want to participate in and the discount range you'd accept.</p>
      </header>

      <LimitsPanel menu={menu} value={limits} onChange={setLimits} />

      {error ? <p className="ob-error" role="alert">{error}</p> : null}

      <footer className="ob-step-foot">
        <button
          type="button"
          className="primary-button"
          onClick={submit}
          disabled={saving || limits.categories.length === 0}
        >
          {saving ? "Finishing…" : "Start receiving opportunities"}
        </button>
      </footer>
    </section>
  );
}
