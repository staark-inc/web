"use client";

import { useActionState, useState } from "react";

import { OFFER_TEMPLATES } from "@/lib/offer-templates";
import { createOffer, updateOffer, type OfferActionState } from "./actions";

const initial: OfferActionState = { error: null, success: false };

type FormOffer = {
  id: string;
  clientId: string;
  title: string;
  scope: string | null;
  terms: string | null;
  oneTimePriceOre: number | null;
  monthlyPriceOre: number | null;
  includedMonths: number;
};

type LeadContext = {
  id: string;
  label: string;
  clientId: string | null;
};

function amount(ore: number | null) {
  return ore === null ? "" : (ore / 100).toFixed(ore % 100 ? 2 : 0);
}

export default function OfferForm({
  clients,
  offer,
  defaultClientId,
  lead,
}: {
  clients: { id: string; name: string }[];
  offer?: FormOffer;
  defaultClientId?: string;
  lead?: LeadContext;
}) {
  const [state, action, pending] = useActionState(offer ? updateOffer : createOffer, initial);
  const [templateId, setTemplateId] = useState("custom");
  const [title, setTitle] = useState(offer?.title ?? "");
  const [scope, setScope] = useState(offer?.scope ?? "");
  const [terms, setTerms] = useState(offer?.terms ?? "");
  const [oneTimePrice, setOneTimePrice] = useState(amount(offer?.oneTimePriceOre ?? null));
  const [monthlyPrice, setMonthlyPrice] = useState(amount(offer?.monthlyPriceOre ?? null));
  const [includedMonths, setIncludedMonths] = useState(String(offer?.includedMonths ?? 6));

  function applyTemplate(nextId: string) {
    setTemplateId(nextId);
    const template = OFFER_TEMPLATES.find((item) => item.id === nextId);
    if (!template) return;

    setTitle(template.title);
    setScope(template.scope);
    setTerms(template.terms);
    setOneTimePrice(template.oneTimePrice);
    setMonthlyPrice(template.monthlyPrice);
    setIncludedMonths(String(template.includedMonths));
  }

  return (
    <form action={action} className="hub-client-form">
      {offer && <input type="hidden" name="offerId" value={offer.id} />}
      {lead && <input type="hidden" name="leadId" value={lead.id} />}
      {lead && <input type="hidden" name="clientId" value={lead.clientId ?? ""} />}

      {!offer && (
        <div className="hub-client-form-field">
          <label htmlFor="offer-template">Offer template</label>
          <select
            id="offer-template"
            value={templateId}
            onChange={(event) => applyTemplate(event.target.value)}
            disabled={pending}
          >
            {OFFER_TEMPLATES.map((template) => (
              <option key={template.id} value={template.id}>{template.name}</option>
            ))}
          </select>
          <small>Choose a preset, then edit anything before saving.</small>
        </div>
      )}

      {lead && !offer && (
        <div className="hub-offer-help">
          Creating this offer from <strong>{lead.label}</strong>. {lead.clientId
            ? "The existing client record will be used."
            : "A client record will be created and linked automatically when the draft is saved."}
        </div>
      )}

      <div className="hub-client-form-grid">
        <div className="hub-client-form-field">
          <label htmlFor="offer-title">Offer title</label>
          <input
            id="offer-title"
            name="title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Website + hosting"
            maxLength={160}
            required
            disabled={pending}
          />
        </div>

        {!lead && (
          <div className="hub-client-form-field">
            <label htmlFor="offer-client">Client</label>
            <select
              id="offer-client"
              name="clientId"
              defaultValue={offer?.clientId ?? defaultClientId ?? ""}
              required
              disabled={pending || Boolean(offer)}
            >
              <option value="" disabled>Select a client</option>
              {clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}
            </select>
          </div>
        )}

        <div className="hub-client-form-field">
          <label htmlFor="offer-onetime">Website price (SEK, excl. VAT)</label>
          <input
            id="offer-onetime"
            name="oneTimePrice"
            inputMode="decimal"
            value={oneTimePrice}
            onChange={(event) => setOneTimePrice(event.target.value)}
            placeholder="2999"
            disabled={pending}
          />
        </div>

        <div className="hub-client-form-field">
          <label htmlFor="offer-monthly">Monthly hosting + support (SEK, excl. VAT)</label>
          <input
            id="offer-monthly"
            name="monthlyPrice"
            inputMode="decimal"
            value={monthlyPrice}
            onChange={(event) => setMonthlyPrice(event.target.value)}
            placeholder="299"
            disabled={pending}
          />
        </div>

        <div className="hub-client-form-field">
          <label htmlFor="offer-months">Included support (months)</label>
          <input
            id="offer-months"
            name="includedMonths"
            type="number"
            min={0}
            max={36}
            value={includedMonths}
            onChange={(event) => setIncludedMonths(event.target.value)}
            required
            disabled={pending}
          />
        </div>
      </div>

      <div className="hub-client-form-field">
        <label htmlFor="offer-scope">Scope and deliverables</label>
        <textarea
          id="offer-scope"
          name="scope"
          rows={7}
          maxLength={10000}
          value={scope}
          onChange={(event) => setScope(event.target.value)}
          placeholder="What the client will receive..."
          disabled={pending}
        />
      </div>

      <div className="hub-client-form-field">
        <label htmlFor="offer-terms">Additional terms</label>
        <textarea
          id="offer-terms"
          name="terms"
          rows={4}
          maxLength={5000}
          value={terms}
          onChange={(event) => setTerms(event.target.value)}
          placeholder="Timeline, revisions, payment terms..."
          disabled={pending}
        />
      </div>

      <p className="hub-offer-help">Saving creates a draft only. You can review every field before sharing the offer with the client.</p>
      {state.error && <p className="hub-compose-error" role="alert">{state.error}</p>}
      {state.success && <p className="hub-compose-success" role="status">Draft saved.</p>}
      <div className="hub-client-form-actions">
        <button type="submit" className="hub-send-button" disabled={pending}>{pending ? "Saving..." : offer ? "Save draft" : "Create draft"}</button>
      </div>
    </form>
  );
}
