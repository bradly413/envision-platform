/** Illustrative figures for the Jazz St. Louis interactive demo. */

export const ILLUSTRATIVE = "Illustrative";

export const FACTS = {
  seats: 214,
  performancesPerYear: 102,
  avgTicket: 45,
  maxTicketRevenue: 990_000,
  operatingExpenses: 3_844_625,
  earnedRevenue: 1_248_109,
  contributions: 1_971_541,
  netFy2024: -635_482,
  netPriorYear: -641_676,
  showNights: 66,
  darkPercent: 82,
  youtubeSubscribers: 20_200,
  youtubeVideos: 419,
  sharedFourTopSeats: 144,
  sharedFourTopPercent: 67,
  coupleFriendlySeats: 62,
  tablesForTwo: 5,
  fbMinimum: 20,
} as const;

export const formatUsd = (n: number, compact = false) => {
  if (compact && Math.abs(n) >= 1_000_000) {
    return `$${(n / 1_000_000).toFixed(2).replace(/\.?0+$/, "")}M`;
  }
  if (compact && Math.abs(n) >= 1_000) {
    return `$${Math.round(n / 1_000)}K`;
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
};

export const MODULES = [
  { id: "math", num: 1, title: "The math", short: "Math" },
  { id: "room", num: 2, title: "The room", short: "Room" },
  { id: "book", num: 3, title: "Book a night", short: "Book" },
  { id: "menu", num: 4, title: "Menu & minimum", short: "Menu" },
  { id: "dark", num: 5, title: "Dark nights", short: "Dark nights" },
  { id: "events", num: 6, title: "Private events", short: "Events" },
  { id: "collab", num: 7, title: "Collaborations", short: "Collabs" },
  { id: "content", num: 8, title: "Content", short: "Content" },
  { id: "app", num: 9, title: "Guest app", short: "App" },
  { id: "plan", num: 10, title: "The plan", short: "Plan" },
] as const;

export type ModuleId = (typeof MODULES)[number]["id"];
