"use client";

import { useActionState } from "react";
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

function amount(ore: number | null) {
  return ore === null ? "" : (ore / 100).toFixed(ore % 100 ? 2 : 0);
}

export default function OfferForm({
  clients,
  offer,
  defaultClientId,
}: {
  clients: { id: string; name: string }[];
  offer?: FormOffer;
  defaultClientId?: string;
}) {
  const [state, action, pending] = useActionState(offer ? updateOffer : createOffer, initial);

  return (
    <form action={action} className="hub-client-form">
      {offer && <input type="hidden" name="offerId" value={offer.id} />}
      <div className="hub-client-form-grid">
        <div className="hub-client-form-field">
          <label htmlFor="offer-title">Offer title</label>
          <input id="offer-title" name="title" defaultValue={offer?.title ?? ""} placeholder="Website + hosting" maxLength={160} required disabled={pending} />
        </div>
        <div className="hub-client-form-field">
          <label htmlFor="offer-client">Client</label>
          <select id="offer-client" name="clientId" defaultValue={offer?.clientId ?? defaultClientId ?? ""} required disabled={pending || Boolean(offer)}>
            <option value="" disabled>Select a client</option>
            {clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}
          </select>
        </div>
        <div className="hub-client-form-field">
          <label htmlFor="offer-onetime">Website price (SEK, excl. VAT)</label>
          <input id="offer-onetime" name="oneTimePrice" inputMode="decimal" defaultValue={amount(offer?.oneTimePriceOre ?? null)} placeholder="2999" disabled={pending} />
        </div>
        <div className="hub-client-form-field">
          <label htmlFor="offer-monthly">Monthly hosting + support (SEK, excl. VAT)</label>
          <input id="offer-monthly" name="monthlyPrice" inputMode="decimal" defaultValue={amount(offer?.monthlyPriceOre ?? null)} placeholder="299" disabled={pending} />
        </div>
        <div className="hub-client-form-field">
          <label htmlFor="offer-months">Included support (months)</label>
          <input id="offer-months" name="includedMonths" type="number" min={0} max={36} defaultValue={offer?.includedMonths ?? 6} required disabled={pending} />
        </div>
      </div>
      <div className="hub-client-form-field">
        <label htmlFor="offer-scope">Scope and deliverables</label>
        <textarea id="offer-scope" name="scope" rows={5} maxLength={10000} defaultValue={offer?.scope ?? ""} placeholder="What the client will receive..." disabled={pending} />
      </div>
      <div className="hub-client-form-field">
        <label htmlFor="offer-terms">Additional terms</label>
        <textarea id="offer-terms" name="terms" rows={3} maxLength={5000} defaultValue={offer?.terms ?? ""} placeholder="Timeline, revisions, payment terms..." disabled={pending} />
      </div>
      <p className="hub-offer-help">Amounts are stored in öre. Sharing and payment are recorded separately; saving here does not send an email or charge the client.</p>
      {state.error && <p className="hub-compose-error" role="alert">{state.error}</p>}
      {state.success && <p className="hub-compose-success" role="status">Draft saved.</p>}
      <div className="hub-client-form-actions">
        <button type="submit" className="hub-send-button" disabled={pending}>{pending ? "Saving..." : offer ? "Save draft" : "Create draft"}</button>
      </div>
    </form>
  );
}
