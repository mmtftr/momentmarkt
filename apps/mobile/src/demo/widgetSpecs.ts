import type { WidgetNode } from "../genui/widgetSchema";

export const rainHeroWidgetSpec: WidgetNode = {
  type: "ScrollView",
  className: "rounded-[34px] bg-cocoa",
  children: [
    {
      type: "Image",
      source:
        "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=1200&q=80",
      accessibilityLabel: "A warm cafe table with coffee on a rainy day",
      className: "h-44 w-full rounded-t-[34px]",
    },
    {
      type: "View",
      className: "p-5",
      children: [
        {
          type: "Text",
          className: "text-xs font-bold uppercase tracking-[3px] text-cream/70",
          text: "Rain trigger",
        },
        {
          type: "Text",
          className: "mt-3 text-3xl font-black leading-9 text-cream",
          text: "Warm up at Cafe Bondi before the rain hits.",
        },
        {
          type: "Text",
          className: "mt-3 text-base leading-6 text-cream/80",
          text: "15% cashback on hot cocoa + banana bread. 82 m away. Valid until 15:00.",
        },
        {
          type: "Pressable",
          className: "mt-5 rounded-2xl bg-cream px-5 py-4",
          action: "redeem",
          text: "Redeem with girocard",
        },
      ],
    },
  ],
};

export const quietStackWidgetSpec: WidgetNode = {
  type: "View",
  className: "rounded-[34px] bg-white p-5",
  children: [
    {
      type: "Text",
      className: "text-xs font-bold uppercase tracking-[3px] text-rain",
      text: "Quiet hour detected",
    },
    {
      type: "Text",
      className: "mt-3 text-3xl font-black leading-9 text-ink",
      text: "Bondi has room right now.",
    },
    {
      type: "View",
      className: "mt-5 gap-3",
      children: [
        {
          type: "Text",
          className: "rounded-2xl bg-cream px-4 py-3 text-base font-semibold text-ink",
          text: "Demand: 54% below usual Saturday lunch traffic",
        },
        {
          type: "Text",
          className: "rounded-2xl bg-cream px-4 py-3 text-base font-semibold text-ink",
          text: "Walk: 82 m from your current H3 cell",
        },
      ],
    },
    {
      type: "Pressable",
      className: "mt-5 rounded-2xl bg-ink px-5 py-4",
      action: "redeem",
      text: "Claim quiet-table cashback",
    },
  ],
};

export const preEventTicketWidgetSpec: WidgetNode = {
  type: "View",
  className: "rounded-[34px] bg-rain p-5",
  children: [
    {
      type: "Text",
      className: "text-xs font-bold uppercase tracking-[3px] text-white/70",
      text: "Before the crowd moves",
    },
    {
      type: "Text",
      className: "mt-3 text-3xl font-black leading-9 text-white",
      text: "Stop before the gallery queue reaches Mitte.",
    },
    {
      type: "Text",
      className: "mt-3 text-base leading-6 text-white/80",
      text: "A nearby event ends soon. Bondi can catch the first wave with a 20-minute cocoa credit.",
    },
    {
      type: "Pressable",
      className: "mt-5 rounded-2xl bg-white px-5 py-4",
      action: "redeem",
      text: "Reserve pre-event offer",
    },
  ],
};

export const demoWidgetSpecs = {
  rainHero: rainHeroWidgetSpec,
  quietStack: quietStackWidgetSpec,
  preEventTicket: preEventTicketWidgetSpec,
};
