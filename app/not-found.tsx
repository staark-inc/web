import type { Metadata } from "next";
import PublicErrorPage from "./components/PublicErrorPage";

export const metadata: Metadata = {
  title: "Sidan kunde inte hittas",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return <PublicErrorPage code="404" />;
}
