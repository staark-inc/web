"use client";

import {
  FormEvent,
  useState,
} from "react";

export default function SetupForm({
  token,
}: {
  token: string;
}) {
  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const [domainMode, setDomainMode] =
    useState<"platform" | "custom">("platform");

  async function submit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setLoading(true);
    setError(null);

    const form =
      new FormData(event.currentTarget);

    const payload = {
      token,

      businessName:
        form.get("businessName"),

      contactEmail:
        form.get("contactEmail"),

      phone:
        form.get("phone"),

      domainMode,

      subdomain:
        domainMode === "platform"
          ? form.get("subdomain")
          : null,

      customDomain:
        domainMode === "custom"
          ? form.get("customDomain")
          : null,

      websiteType:
        form.get("websiteType"),

      theme:
        form.get("theme"),

      ownerName:
        form.get("ownerName"),

      ownerEmail:
        form.get("ownerEmail"),

      ownerPassword:
        form.get("ownerPassword"),

      pageContact:
        form.get("pageContact") === "on",

      pageAbout:
        form.get("pageAbout") === "on",

      pageServices:
        form.get("pageServices") === "on",
    };

    try {
      const response =
        await fetch(
          "/api/saas/setup/complete",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify(
              payload,
            ),
          },
        );

      const data =
        await response.json();

      if (
        !response.ok ||
        !data?.ok ||
        !data?.adminUrl
      ) {
        throw new Error(
          data?.error ||
            "Kunde inte skapa webbplatsen.",
        );
      }

      window.location.assign(
        data.adminUrl,
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Något gick fel.",
      );

      setLoading(false);
    }
  }

  return (
    <form
      className="saas-setup-form"
      onSubmit={submit}
    >
      <section className="saas-setup-card">
        <div className="saas-setup-card-head">
          <div className="saas-setup-step">
            01
          </div>

          <div>
            <h2>Företaget</h2>
            <p>
              Grunduppgifter som används
              på din nya webbplats.
            </p>
          </div>
        </div>

        <div className="saas-setup-grid">
          <label className="saas-setup-field saas-setup-field-wide">
            <span>Företagsnamn</span>

            <input
              name="businessName"
              placeholder="Lindberg Interiör AB"
              required
            />
          </label>

          <label className="saas-setup-field">
            <span>Kontaktmail</span>

            <input
              name="contactEmail"
              type="email"
              placeholder="kontakt@foretag.se"
              required
            />
          </label>

          <label className="saas-setup-field">
            <span>Telefon</span>

            <input
              name="phone"
              type="tel"
              placeholder="+46 70 123 45 67"
            />
          </label>

          <div className="saas-setup-field saas-setup-field-wide">
            <span>Webbadress</span>

            <div className="saas-domain-choice" role="radiogroup" aria-label="Webbadress">
              <label className={domainMode === "platform" ? "is-selected" : ""}>
                <input
                  type="radio"
                  name="domainMode"
                  value="platform"
                  checked={domainMode === "platform"}
                  onChange={() => setDomainMode("platform")}
                />
                <div>
                  <strong>Staark-adress</strong>
                  <span>Snabbast att komma igång. SSL och routing är klara direkt.</span>
                </div>
              </label>

              <label className={domainMode === "custom" ? "is-selected" : ""}>
                <input
                  type="radio"
                  name="domainMode"
                  value="custom"
                  checked={domainMode === "custom"}
                  onChange={() => setDomainMode("custom")}
                />
                <div>
                  <strong>Jag har en egen domän</strong>
                  <span>Vi skapar webbplatsen direkt och hjälper dig koppla DNS.</span>
                </div>
              </label>
            </div>

            {domainMode === "platform" ? (
              <>
                <div className="saas-domain-input">
                  <input
                    name="subdomain"
                    placeholder="mittforetag"
                    minLength={3}
                    maxLength={63}
                    required
                  />

                  <strong>.staark.app</strong>
                </div>

                <small>
                  Exempel: mittforetag.staark.app
                </small>
              </>
            ) : (
              <>
                <input
                  name="customDomain"
                  placeholder="mittforetag.se"
                  inputMode="url"
                  autoCapitalize="none"
                  autoCorrect="off"
                  required
                />

                <small>
                  Skriv bara domännamnet. Vi skapar även en teknisk Staark-adress som fallback tills DNS är verifierad.
                </small>
              </>
            )}
          </div>

          <label className="saas-setup-field">
            <span>Typ av webbplats</span>

            <select
              name="websiteType"
              defaultValue="business"
            >
              <option value="business">
                Företag
              </option>

              <option value="salon">
                Salong
              </option>

              <option value="restaurant">
                Restaurang
              </option>

              <option value="hotel">
                Hotell
              </option>

              <option value="automotive">
                Fordon
              </option>

              <option value="portfolio">
                Portfolio
              </option>

              <option value="custom">
                Annat
              </option>
            </select>
          </label>

          <label className="saas-setup-field">
            <span>Tema</span>

            <select
              name="theme"
              defaultValue="light"
            >
              <option value="light">
                Light
              </option>

              <option value="salong">
                Salong
              </option>

              <option value="skonhet">
                Skönhet
              </option>

              <option value="el">
                El
              </option>

              <option value="gastfrihet">
                Gästfrihet
              </option>

              <option value="byra">
                Byrå
              </option>

              <option value="webb">
                Webb
              </option>

              <option value="kreator">
                Kreatör
              </option>
            </select>
          </label>
        </div>
      </section>

      <section className="saas-setup-card">
        <div className="saas-setup-card-head">
          <div className="saas-setup-step">
            02
          </div>

          <div>
            <h2>Sidor</h2>
            <p>
              Välj vilka grundsidor vi ska
              skapa åt dig.
            </p>
          </div>
        </div>

        <div className="saas-page-options">
          <label>
            <input
              type="checkbox"
              name="pageServices"
              defaultChecked
            />

            <div>
              <strong>
                Tjänster
              </strong>
              <span>
                Visa vad företaget erbjuder.
              </span>
            </div>
          </label>

          <label>
            <input
              type="checkbox"
              name="pageAbout"
            />

            <div>
              <strong>
                Om oss
              </strong>
              <span>
                Presentera företaget och
                teamet.
              </span>
            </div>
          </label>

          <label>
            <input
              type="checkbox"
              name="pageContact"
              defaultChecked
            />

            <div>
              <strong>
                Kontakt
              </strong>
              <span>
                Kontaktuppgifter och formulär.
              </span>
            </div>
          </label>
        </div>
      </section>

      <section className="saas-setup-card">
        <div className="saas-setup-card-head">
          <div className="saas-setup-step">
            03
          </div>

          <div>
            <h2>Administratör</h2>
            <p>
              Kontot som ska kunna logga in
              och hantera webbplatsen.
            </p>
          </div>
        </div>

        <div className="saas-setup-grid">
          <label className="saas-setup-field">
            <span>Namn</span>

            <input
              name="ownerName"
              placeholder="För- och efternamn"
              autoComplete="name"
              required
            />
          </label>

          <label className="saas-setup-field">
            <span>E-post</span>

            <input
              name="ownerEmail"
              type="email"
              placeholder="admin@foretag.se"
              autoComplete="email"
              required
            />
          </label>

          <label className="saas-setup-field saas-setup-field-wide">
            <span>Lösenord</span>

            <input
              name="ownerPassword"
              type="password"
              minLength={8}
              autoComplete="new-password"
              placeholder="Minst 8 tecken"
              required
            />
          </label>
        </div>
      </section>

      {error ? (
        <div
          className="saas-setup-error"
          role="alert"
        >
          {error}
        </div>
      ) : null}

      <div className="saas-setup-submit">
        <div>
          <strong>
            Redo att börja?
          </strong>

          <span>
            Vi skapar webbplatsen direkt.
          </span>
        </div>

        <button
          type="submit"
          className="site-button site-button-primary"
          disabled={loading}
        >
          {loading
            ? "Skapar webbplatsen…"
            : "Skapa webbplats"}
        </button>
      </div>
    </form>
  );
}
