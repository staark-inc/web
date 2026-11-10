import DesignPreview from "./DesignPreview";
import { isPreviewSection } from "./preview-sections";

export const dynamic = "force-dynamic";

export default async function DesignPreviewPage({
  searchParams,
}: {
  searchParams: Promise<{ section?: string }>;
}) {
  const { section } = await searchParams;
  return <DesignPreview initialSection={isPreviewSection(section) ? section : "dashboard"} />;
}
