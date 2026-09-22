"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { CheckCircle2, LifeBuoy } from "lucide-react";

type Status = "idle" | "sending" | "success" | "error";

export default function SupportRequestForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  const [reference, setReference] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "sending") return;

    const form = event.currentTarget;
    const data = new FormData(form);

    setStatus("sending");
    setError("");

    try {
      const response = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.get("name"),
          email: data.get("email"),
          company: data.get("company"),
          website: data.get("website"),
          category: data.get("category"),
          priority: data.get("priority"),
          title: data.get("title"),
          description: data.get("description"),
          fax: data.get("fax"),
        }),
      });

      const result = await response.json().catch(() => null);
      if (!response.ok) throw new Error(result?.error || "Supportärendet kunde inte skickas.");

      setReference(result?.reference || "SUP-RECEIVED");
      setStatus("success");
      form.reset();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Supportärendet kunde inte skickas.");
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className="public-support-success">
        <CheckCircle2 size={28} />
        <span>SUPPORTÄRENDE SKAPAT</span>
        <h2>Tack — vi har fått ditt ärende.</h2>
        <p>Ditt ärendenummer är <strong>{reference}</strong>. Spara numret om du behöver hänvisa till ärendet senare.</p>
        <button type="button" className="v2-button v2-button-primary" onClick={() => { setReference(""); setStatus("idle"); }}>
          Skapa ett nytt ärende
        </button>
      </div>
    );
  }

  return (
    <form className="public-support-form" onSubmit={submit}>
      <div className="public-support-form-heading">
        <LifeBuoy size={21} />
        <div><span>SUPPORT</span><h2>Skapa supportärende</h2></div>
      </div>

      <div className="public-support-grid">
        <label>Namn<input name="name" required maxLength={120} autoComplete="name" placeholder="Anna Andersson" /></label>
        <label>E-post<input name="email" type="email" required maxLength={320} autoComplete="email" placeholder="anna@foretag.se" /></label>
        <label>Företag<input name="company" maxLength={160} autoComplete="organization" placeholder="Företag AB" /></label>
        <label>Webbplats<input name="website" maxLength={300} inputMode="url" placeholder="https://..." /></label>
        <label>Kategori<select name="category" defaultValue="WEBSITE" required><option value="WEBSITE">Webbplats</option><option value="HOSTING">Hosting</option><option value="EMAIL">E-post</option><option value="BUG">Fel / bug</option><option value="CHANGE">Ändring</option><option value="OTHER">Annat</option></select></label>
        <label>Prioritet<select name="priority" defaultValue="NORMAL" required><option value="NORMAL">Normal</option><option value="URGENT">Brådskande</option></select></label>
      </div>

      <label>Rubrik<input name="title" required maxLength={160} placeholder="Ex. Kontaktformuläret fungerar inte" /></label>
      <label>Beskriv problemet<textarea name="description" required minLength={10} maxLength={10000} rows={7} placeholder="Beskriv vad som händer, vad du förväntade dig och gärna när problemet började..." /></label>

      <label className="public-support-honeypot" aria-hidden="true">Fax<input name="fax" tabIndex={-1} autoComplete="off" /></label>

      <p className="public-support-priority-note">Välj Brådskande främst vid driftstopp eller kritiska fel som påverkar verksamheten.</p>
      {status === "error" && <p className="public-support-error" role="alert">{error}</p>}

      <p className="public-support-privacy-note">
        När du skickar ärendet behandlar vi uppgifterna för att kunna hantera supporten. Läs vår{" "}
        <Link href="/integritetspolicy">integritetspolicy</Link>.
      </p>

      <button type="submit" className="v2-button v2-button-primary public-support-submit" disabled={status === "sending"}>
        {status === "sending" ? "Skickar..." : "Skicka supportärende"}<LifeBuoy size={17} />
      </button>
    </form>
  );
}
