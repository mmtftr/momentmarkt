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

export function OffersIcon(p: Props) {
  return (
    <svg {...baseProps} {...p}>
      <path d="M3.5 5.5h13l-1.4 9.4a1.4 1.4 0 01-1.4 1.2H6.3a1.4 1.4 0 01-1.4-1.2L3.5 5.5z" />
      <path d="M7 5.5V4a3 3 0 016 0v1.5" />
    </svg>
  );
}

export function BoundsIcon(p: Props) {
  return (
    <svg {...baseProps} {...p}>
      <path d="M3 10h14" />
      <circle cx="6" cy="10" r="2" fill="currentColor" stroke="none" />
      <circle cx="14" cy="10" r="2" fill="currentColor" stroke="none" />
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
