import { createHash } from "node:crypto";

import type { Prisma } from "@/generated/prisma/client";

export type SecurityAuditClient = Pick<
  Prisma.TransactionClient,
  "securityAuditEvent"
>;

export type SecurityAuditInput = {
  userId?: string | null;
  type: string;
  ip?: string | null;
  metadata?: Prisma.InputJsonValue;
};

export async function recordSecurityAudit(
  client: SecurityAuditClient,
  input: SecurityAuditInput
) {
  const ipHash = input.ip
    ? createHash("sha256")
        .update(input.ip)
        .digest("hex")
    : null;

  await client.securityAuditEvent.create({
    data: {
      userId: input.userId ?? null,
      type: input.type,
      ipHash,
      ...(input.metadata !== undefined
        ? { metadata: input.metadata }
        : {}),
    },
  });
}
