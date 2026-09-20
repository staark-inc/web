import type {
  ReactNode,
} from "react";

import { prisma } from "@/lib/prisma";

import {
  MobileBadgeEmitter,
} from "../../components/hub/MobileBadgeEmitter";

type HubTemplateProps = {
  children: ReactNode;
};

export default async function HubTemplate({
  children,
}: HubTemplateProps) {
  const [
    inboxCount,
    leadsCount,
  ] = await Promise.all([
    prisma.message.count({
      where: {
        direction: "INBOUND",
        isRead: false,
      },
    }),

    prisma.lead.count({
      where: {
        status: "NEW",
      },
    }),
  ]);

  return (
    <>
      <MobileBadgeEmitter
        inboxCount={inboxCount}
        leadsCount={leadsCount}
      />

      {children}
    </>
  );
}