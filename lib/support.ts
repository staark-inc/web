import type {
  SupportCategory,
  SupportCoverage,
  SupportPriority,
  SupportStatus,
} from "@/generated/prisma/client";

export const supportStatusLabels: Record<SupportStatus, string> = {
  OPEN: "Open",
  IN_PROGRESS: "In progress",
  WAITING_CLIENT: "Waiting on client",
  RESOLVED: "Resolved",
};

export const supportCoverageLabels: Record<SupportCoverage, string> = {
  UNASSESSED: "Check agreement",
  INCLUDED: "Included in support",
  EXTRA: "Separate offer needed",
};

export const supportCategoryLabels: Record<SupportCategory, string> = {
  WEBSITE: "Website",
  HOSTING: "Hosting",
  EMAIL: "Email",
  BUG: "Bug",
  CHANGE: "Change request",
  OTHER: "Other",
};

export const supportPriorityLabels: Record<SupportPriority, string> = {
  NORMAL: "Normal",
  URGENT: "Urgent",
};
