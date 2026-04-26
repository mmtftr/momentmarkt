/*
 * Inline-SVG nav icons — hand-tuned to ~18px viewBox so they sit at the same
 * weight as the cocoa typography. No icon library dep.
 */

type Props = { className?: string; "aria-hidden"?: boolean };

const baseProps = {
  width: 18,
  height: 18,
  viewBox: "0 0 20 20",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function TodayIcon(p: Props) {
  return (
    <svg {...baseProps} {...p}>
      <circle cx="10" cy="10" r="3.2" />
      <path d="M10 2v2M10 16v2M2 10h2M16 10h2M4.4 4.4l1.4 1.4M14.2 14.2l1.4 1.4M15.6 4.4l-1.4 1.4M5.8 14.2l-1.4 1.4" />
    </svg>
  );
}

export function BoundsIcon(p: Props) {
  return (
    <svg {...baseProps} {...p}>
      <path d="M3 6h14M3 14h14" />
      <circle cx="7" cy="6" r="1.8" fill="currentColor" stroke="none" />
      <circle cx="13" cy="14" r="1.8" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function AuditIcon(p: Props) {
  return (
    <svg {...baseProps} {...p}>
      <path d="M5 3h7l3 3v11a1 1 0 01-1 1H5a1 1 0 01-1-1V4a1 1 0 011-1z" />
      <path d="M12 3v3h3" />
      <path d="M7 10h6M7 13h6M7 16h4" />
    </svg>
  );
}

export function PerformanceIcon(p: Props) {
  return (
    <svg {...baseProps} {...p}>
      <path d="M3 17V8M8 17V4M13 17v-6M17 17v-9" />
      <path d="M2 17h17" />
    </svg>
  );
}

export function InsightsIcon(p: Props) {
  return (
    <svg {...baseProps} {...p}>
      <path d="M10 2a6 6 0 014 10.5v2.2a1.3 1.3 0 01-1.3 1.3H7.3A1.3 1.3 0 016 14.7v-2.2A6 6 0 0110 2z" />
      <path d="M8 18h4" />
    </svg>
  );
}

export function SettingsIcon(p: Props) {
  return (
    <svg {...baseProps} {...p}>
      <circle cx="10" cy="10" r="2.2" />
      <path d="M16.5 10a6.5 6.5 0 00-.1-1.2l1.5-1.2-1.5-2.6-1.8.7a6.5 6.5 0 00-2.1-1.2L12.2 2.6h-3l-.4 1.9a6.5 6.5 0 00-2.1 1.2l-1.8-.7-1.5 2.6 1.5 1.2A6.5 6.5 0 003.5 10c0 .4 0 .8.1 1.2L2.1 12.4l1.5 2.6 1.8-.7a6.5 6.5 0 002.1 1.2l.4 1.9h3l.4-1.9a6.5 6.5 0 002.1-1.2l1.8.7 1.5-2.6-1.5-1.2c0-.4.1-.8.1-1.2z" />
    </svg>
  );
}

export function PrivacyIcon(p: Props) {
  return (
    <svg {...baseProps} {...p}>
      <path d="M10 2l6 2.5v5c0 4-2.7 7.4-6 8.5-3.3-1.1-6-4.5-6-8.5v-5L10 2z" />
      <path d="M7.5 10.2l1.8 1.8L13 8" />
    </svg>
  );
}
