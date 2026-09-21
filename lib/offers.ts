import type { OfferStatus } from "@/generated/prisma/client";

export const offerStatusLabels: Record<OfferStatus, string> = {
  DRAFT: "Draft",
  SHARED: "Shared",
  ACCEPTED: "Accepted",
  DECLINED: "Declined",
};

export function formatOfferAmount(ore: number | null) {
  if (ore === null) return "Not set";
  return new Intl.NumberFormat("sv-SE", {
    style: "currency",
    currency: "SEK",
    maximumFractionDigits: 2,
  }).format(ore / 100);
}
