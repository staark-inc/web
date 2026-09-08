"use client";

import { FormEvent, useState } from "react";
import { ArrowUpRight } from "lucide-react";

export default function ContactForm() {
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("sending");
    const form = event.currentTarget;
    const data = new FormData(form);
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.get("name"),
          email: data.get("email"),
          message: data.get("message"),
        }),
      });
      if (!response.ok) throw new Error("Contact request failed");
      form.reset();
      setStatus("success");
    } catch {
      setStatus("error");
    }
  }

  return (
    <form className="contact-form" onSubmit={submit}>
      <h3>Skicka ett snabbmeddelande</h3>
      <label>Namn<input name="name" required maxLength={120} placeholder="ex. Andersson Anna" /></label>
      <label>E-post<input name="email" required maxLength={320} type="email" placeholder="ex. anna@foretag.se" /></label>
      <label>Berätta kort om ditt projekt<textarea name="message" required maxLength={5000} placeholder="Vad behöver du hjälp med?" rows={5} /></label>
      <button className="button button-primary" disabled={status === "sending"} type="submit">
        {status === "sending" ? "Skickar..." : "Skicka meddelande"} <ArrowUpRight size={16} />
      </button>
      {status === "success" && <p className="form-status success">Tack! Ditt meddelande har skickats.</p>}
      {status === "error" && <p className="form-status error">Meddelandet kunde inte skickas. Försök igen.</p>}
    </form>
  );
}
