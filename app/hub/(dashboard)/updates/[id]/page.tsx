import { notFound } from "next/navigation";
import NewsEditor from "@/components/news/NewsEditor";
import { prisma } from "@/lib/prisma";
export const dynamic = "force-dynamic";
export default async function EditUpdatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const update = await prisma.saasAnnouncement.findUnique({ where: { id } });
  if (!update) notFound();
  return (
    <div className="hub-page hub-updates-page">
      <NewsEditor
        initial={{
          ...update,
          audiencePlan: update.audiencePlan ?? "",
          ctaLabel: update.ctaLabel ?? "",
          ctaUrl: update.ctaUrl ?? "",
          coverImageUrl: update.coverImageUrl ?? "",
          updatedAt: update.updatedAt.toISOString(),
        }}
      />
    </div>
  );
}
