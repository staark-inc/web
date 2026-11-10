import { prisma } from "@/lib/prisma";

export type UpdatedAccount = {
  id: string;
  email: string;
  role: "ADMIN";
  sessionVersion: number;
};

const accountSelect = {
  id: true,
  email: true,
  role: true,
  sessionVersion: true,
} as const;

/**
 * Password rotation invalidates every existing token. The caller can issue a
 * replacement cookie for the current browser after this update succeeds.
 */
export async function updateUserPassword(
  userId: string,
  passwordHash: string
): Promise<UpdatedAccount> {
  return prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      passwordHash,
      sessionVersion: {
        increment: 1,
      },
    },
    select: accountSelect,
  });
}

export async function updateUserIdentity(
  userId: string,
  input: {
    name: string;
    email: string;
  },
  options: {
    invalidateSessions: boolean;
  }
): Promise<UpdatedAccount> {
  return prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      name: input.name,
      email: input.email,
      ...(options.invalidateSessions
        ? {
            sessionVersion: {
              increment: 1,
            },
          }
        : {}),
    },
    select: accountSelect,
  });
}

/**
 * Operational account disable hook. The auth check rejects the account on
 * the next request; incrementing the version also makes any later re-enable
 * start from a clean session generation.
 */
export async function disableUser(
  userId: string
): Promise<UpdatedAccount> {
  return prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      disabledAt: new Date(),
      sessionVersion: {
        increment: 1,
      },
    },
    select: accountSelect,
  });
}
