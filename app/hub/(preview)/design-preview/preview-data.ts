export type PreviewStatus = "Active" | "Prospect" | "At risk";

export type PreviewClient = {
  id: string;
  company: string;
  contact: string;
  email: string;
  initials: string;
  status: PreviewStatus;
  owner: "Alexandra" | "Mia" | "Jonas";
  value: number;
  nextStep: string;
  updated: string;
};

export const previewClients: PreviewClient[] = [
  {
    id: "northstar",
    company: "Northstar Dental",
    contact: "Elin Sandberg",
    email: "elin@northstar.example",
    initials: "ND",
    status: "Active",
    owner: "Alexandra",
    value: 184000,
    nextStep: "Review homepage concept",
    updated: "Today, 10:42",
  },
  {
    id: "fjord-field",
    company: "Fjord & Field",
    contact: "Oskar Lind",
    email: "oskar@fjordfield.example",
    initials: "FF",
    status: "Prospect",
    owner: "Mia",
    value: 96000,
    nextStep: "Send proposal",
    updated: "Today, 09:18",
  },
  {
    id: "lumen",
    company: "Lumen Architects",
    contact: "Sara Nystrom",
    email: "sara@lumen.example",
    initials: "LA",
    status: "Active",
    owner: "Jonas",
    value: 240000,
    nextStep: "Waiting on photography",
    updated: "Yesterday",
  },
  {
    id: "copperline",
    company: "Copperline Coffee",
    contact: "Hugo Berg",
    email: "hugo@copperline.example",
    initials: "CC",
    status: "At risk",
    owner: "Alexandra",
    value: 72000,
    nextStep: "Escalate delayed feedback",
    updated: "Yesterday",
  },
  {
    id: "meridian",
    company: "Meridian Fitness",
    contact: "Nora Ek",
    email: "nora@meridian.example",
    initials: "MF",
    status: "Active",
    owner: "Mia",
    value: 148000,
    nextStep: "Launch booking flow",
    updated: "2 days ago",
  },
  {
    id: "bluebird",
    company: "Bluebird Legal",
    contact: "Adam Sten",
    email: "adam@bluebird.example",
    initials: "BL",
    status: "Prospect",
    owner: "Jonas",
    value: 120000,
    nextStep: "Qualify budget",
    updated: "2 days ago",
  },
  {
    id: "pine-peak",
    company: "Pine & Peak",
    contact: "Ida Holm",
    email: "ida@pinepeak.example",
    initials: "PP",
    status: "Active",
    owner: "Alexandra",
    value: 88000,
    nextStep: "Publish case study",
    updated: "3 days ago",
  },
  {
    id: "atlas",
    company: "Atlas Dental",
    contact: "Leo Wallin",
    email: "leo@atlas.example",
    initials: "AD",
    status: "At risk",
    owner: "Mia",
    value: 64000,
    nextStep: "Resolve handover gap",
    updated: "3 days ago",
  },
  {
    id: "willow",
    company: "Willow Studio",
    contact: "Maja Lund",
    email: "maja@willow.example",
    initials: "WS",
    status: "Active",
    owner: "Jonas",
    value: 132000,
    nextStep: "Schedule content workshop",
    updated: "4 days ago",
  },
  {
    id: "harbor",
    company: "Harbor Clinic",
    contact: "Erik Ahl",
    email: "erik@harbor.example",
    initials: "HC",
    status: "Prospect",
    owner: "Alexandra",
    value: 110000,
    nextStep: "Confirm decision makers",
    updated: "5 days ago",
  },
  {
    id: "nova",
    company: "Nova Interiors",
    contact: "Linn Dahl",
    email: "linn@nova.example",
    initials: "NI",
    status: "Active",
    owner: "Mia",
    value: 156000,
    nextStep: "Prepare visual direction",
    updated: "6 days ago",
  },
  {
    id: "kestrel",
    company: "Kestrel Labs",
    contact: "Theo Rask",
    email: "theo@kestrel.example",
    initials: "KL",
    status: "At risk",
    owner: "Jonas",
    value: 79000,
    nextStep: "Reconfirm launch scope",
    updated: "1 week ago",
  },
];

export const previewOwners = ["All owners", "Alexandra", "Mia", "Jonas"] as const;
export const previewStatuses = ["All", "Active", "Prospect", "At risk"] as const;

export const previewAttention = [
  {
    title: "Copperline Coffee needs a decision",
    meta: "Client feedback is 4 days overdue",
    tone: "danger" as const,
    section: "detail" as const,
  },
  {
    title: "Two proposals are waiting to send",
    meta: "Combined value SEK 206,000",
    tone: "warning" as const,
    section: "collection" as const,
  },
  {
    title: "Northstar Dental review is ready",
    meta: "Homepage concept v2",
    tone: "info" as const,
    section: "detail" as const,
  },
  {
    title: "All invoices for this week are paid",
    meta: "No billing action required",
    tone: "success" as const,
    section: "settings" as const,
  },
];

export const previewActivity = [
  {
    title: "Offer accepted by Fjord & Field",
    meta: "SEK 96,000 · 18 minutes ago",
    initials: "FF",
    tone: "success" as const,
  },
  {
    title: "Northstar Dental replied to a thread",
    meta: "Homepage feedback · 42 minutes ago",
    initials: "ND",
    tone: "info" as const,
  },
  {
    title: "Mia added a note to Meridian Fitness",
    meta: "Launch checklist · 1 hour ago",
    initials: "MF",
    tone: "neutral" as const,
  },
  {
    title: "Support request resolved",
    meta: "WordPress plugin update · 2 hours ago",
    initials: "WS",
    tone: "success" as const,
  },
];

export const previewSources = [
  { label: "Referrals", value: 42, color: "accent" },
  { label: "Website", value: 28, color: "info" },
  { label: "Outbound", value: 18, color: "success" },
  { label: "Partners", value: 12, color: "warning" },
] as const;

export const previewNotifications = [
  {
    id: "n1",
    title: "New lead assigned",
    message: "Fjord & Field was assigned to your pipeline.",
    time: "8 min ago",
    unread: true,
    tone: "info" as const,
  },
  {
    id: "n2",
    title: "Offer accepted",
    message: "Northstar Dental accepted the website proposal.",
    time: "34 min ago",
    unread: true,
    tone: "success" as const,
  },
  {
    id: "n3",
    title: "Feedback is overdue",
    message: "Copperline Coffee has not responded to the review request.",
    time: "2 h ago",
    unread: true,
    tone: "warning" as const,
  },
  {
    id: "n4",
    title: "Invoice paid",
    message: "Meridian Fitness paid invoice #1042.",
    time: "Yesterday",
    unread: false,
    tone: "success" as const,
  },
];

export const previewTimeline = [
  {
    title: "Homepage concept v2 shared",
    meta: "Today, 10:42 · Alexandra",
    body: "Shared the revised hero, service cards and booking flow for review.",
    tone: "info" as const,
  },
  {
    title: "Discovery call completed",
    meta: "Yesterday, 15:10 · Mia",
    body: "Confirmed two decision makers and the September launch window.",
    tone: "success" as const,
  },
  {
    title: "Requirements updated",
    meta: "2 days ago · Jonas",
    body: "Added accessibility review and copy support to the scope.",
    tone: "neutral" as const,
  },
  {
    title: "Proposal viewed by client",
    meta: "4 days ago · System",
    body: "The client opened the proposal three times.",
    tone: "warning" as const,
  },
];

export type PreviewIntegration = {
  id: string;
  name: string;
  description: string;
  status: string;
  tone: "success" | "warning" | "neutral";
  action: string;
};

export const previewIntegrations: PreviewIntegration[] = [
  {
    id: "stripe",
    name: "Stripe",
    description: "Invoices, subscriptions and payment status.",
    status: "Connected",
    tone: "success" as const,
    action: "Manage",
  },
  {
    id: "gmail",
    name: "Gmail",
    description: "Shared inbox, thread sync and attachments.",
    status: "Connected",
    tone: "success" as const,
    action: "Manage",
  },
  {
    id: "wordpress",
    name: "WordPress",
    description: "Release checks and client site health.",
    status: "Needs attention",
    tone: "warning" as const,
    action: "Review",
  },
  {
    id: "github",
    name: "GitHub",
    description: "Deployments, commits and preview builds.",
    status: "Not connected",
    tone: "neutral" as const,
    action: "Connect",
  },
];

export const previewTrendLabels = [
  "Sep 1",
  "Sep 4",
  "Sep 7",
  "Sep 10",
  "Sep 13",
  "Sep 16",
  "Sep 19",
  "Sep 22",
  "Sep 25",
  "Sep 28",
  "Oct 1",
  "Oct 4",
];

export const previewTrendSeries = {
  "7d": [18, 22, 20, 28, 31, 29, 36, 40, 38, 46, 51, 49],
  "30d": [24, 30, 27, 36, 34, 42, 47, 44, 55, 58, 63, 69],
  "90d": [12, 19, 24, 21, 31, 38, 35, 48, 52, 61, 66, 74],
} as const;

export type PreviewTrendRange = keyof typeof previewTrendSeries;

export function formatPreviewAmount(value: number) {
  return new Intl.NumberFormat("en-SE", {
    style: "currency",
    currency: "SEK",
    maximumFractionDigits: 0,
  }).format(value);
}
