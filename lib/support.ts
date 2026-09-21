import type { SupportCoverage, SupportStatus } from "@/generated/prisma/client";

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
