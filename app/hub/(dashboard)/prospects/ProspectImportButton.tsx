"use client";

import { ChangeEvent, useRef, useState } from "react";
import { Upload } from "lucide-react";
import { useRouter } from "next/navigation";

type ImportResponse = {
  ok?: boolean;
  imported?: number;
  skipped?: number;
  error?: string;
};

export default function ProspectImportButton() {
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    setBusy(true);
    setMessage(null);
    setIsError(false);

    try {
      const raw = await file.text();
      const parsed: unknown = JSON.parse(raw);
      const prospects = Array.isArray(parsed)
        ? parsed
        : parsed && typeof parsed === "object" && Array.isArray((parsed as { prospects?: unknown }).prospects)
          ? (parsed as { prospects: unknown[] }).prospects
          : null;

      if (!prospects) {
        throw new Error("The JSON must contain an array of prospects.");
      }

      if (prospects.length === 0) {
        throw new Error("The JSON file contains no prospects.");
      }

      if (prospects.length > 1000) {
        throw new Error("Maximum 1000 prospects per import.");
      }

      const response = await fetch("/api/hub/prospects/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prospects }),
      });

      const result = (await response.json()) as ImportResponse;

      if (!response.ok || !result.ok) {
        throw new Error(result.error || "Import failed.");
      }

      setMessage(
        `Imported ${result.imported ?? 0}${result.skipped ? ` · skipped ${result.skipped}` : ""}`,
      );
      router.refresh();
    } catch (error) {
      setIsError(true);
      setMessage(error instanceof Error ? error.message : "Import failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="hub-prospect-import-wrap">
      <input
        ref={inputRef}
        type="file"
        accept="application/json,.json"
        className="hub-prospect-import-input"
        onChange={handleFile}
      />

      <button
        type="button"
        className="hub-prospect-import-button"
        disabled={busy}
        onClick={() => inputRef.current?.click()}
      >
        <Upload size={15} />
        {busy ? "Importing..." : "Import prospects"}
      </button>

      {message && (
        <span
          className={
            isError
              ? "hub-prospect-import-message hub-prospect-import-message-error"
              : "hub-prospect-import-message"
          }
          role="status"
        >
          {message}
        </span>
      )}
    </div>
  );
}
