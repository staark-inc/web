import { redirect } from "next/navigation";

export default async function LegacySaaSSubscriptionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/hub/saas/subscriptions/${id}`);
}
