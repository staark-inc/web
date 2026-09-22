"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { sendGAEvent } from "@next/third-parties/google";
import { hasAnalyticsConsent } from "@/lib/consent";

export default function ContactForm() {
  const [status, setStatus] = useState<
    "idle" | "sending" | "success" | "error"
  >("idle");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (status === "sending") {
      return;
    }

    setStatus("sending");

    const form = event.currentTarget;
    const data = new FormData(form);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          name: data.get("name"),
          email: data.get("email"),
          message: data.get("message"),
        }),
      });

      if (!response.ok) {
        throw new Error("Contact request failed");
      }

      if (hasAnalyticsConsent()) {
        sendGAEvent("event", "generate_lead", {
          lead_source: "contact_form",
        });
      }

      form.reset();
      setStatus("success");
    } catch (error) {
      console.error("Contact form error:", error);
      setStatus("error");
    }
  }

  return (
    <form
      className="contact-form"
      action="/api/contact"
      method="post"
      onSubmit={submit}
    >
      <h3>Skicka ett snabbmeddelande</h3>

      <label htmlFor="contact-name">
        Namn

        <input
          id="contact-name"
          name="name"
          required
          maxLength={120}
          placeholder="ex. Andersson Anna"
        />
      </label>

      <label htmlFor="contact-email">
        E-post

        <input
          id="contact-email"
          name="email"
          required
          maxLength={320}
          type="email"
          placeholder="ex. anna@foretag.se"
        />
      </label>

      <label htmlFor="contact-message">
        Berätta kort om ditt projekt

        <textarea
          id="contact-message"
          name="message"
          required
          maxLength={5000}
          placeholder="Vad behöver du hjälp med?"
          rows={5}
        />
      </label>

      <p className="form-privacy-note">
        När du skickar formuläret behandlar vi uppgifterna för att kunna svara på din förfrågan. Läs vår{" "}
        <Link href="/integritetspolicy">integritetspolicy</Link>.
      </p>

      <button
        className="button button-primary"
        disabled={status === "sending"}
        type="submit"
      >
        {status === "sending"
          ? "Skickar..."
          : "Skicka meddelande"}

        <ArrowUpRight size={16} />
      </button>

      {status === "success" && (
        <p
          className="form-status success"
          role="status"
        >
          Tack! Ditt meddelande har skickats.
        </p>
      )}

      {status === "error" && (
        <p
          className="form-status error"
          role="alert"
        >
          Meddelandet kunde inte skickas.
          Försök igen.
        </p>
      )}
    </form>
  );
}