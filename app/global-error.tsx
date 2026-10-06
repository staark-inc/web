"use client";

import PublicErrorPage from "./components/PublicErrorPage";
import "./globals.css";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="sv">
      <body style={{ fontFamily: "system-ui, sans-serif" }}><PublicErrorPage code="500" onRetry={reset} /></body>
    </html>
  );
}
