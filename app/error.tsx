"use client";

import PublicErrorPage from "./components/PublicErrorPage";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <PublicErrorPage code="500" onRetry={reset} />;
}
