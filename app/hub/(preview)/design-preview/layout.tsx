import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Hub design preview",
  description: "Isolated Staark Hub Design System 2.0 interactive preview.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default async function DesignPreviewLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSession();

  if (!session || session.role !== "ADMIN") {
    redirect("/hub/login");
  }

  return children;
}
