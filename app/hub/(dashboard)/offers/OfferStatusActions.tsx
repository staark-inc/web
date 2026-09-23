"use client";

import { useActionState } from "react";
import { changeOfferStatus, type OfferActionState } from "./actions";

const initial: OfferActionState = { error: null, success: false };

export default function OfferStatusActions({ offerId, status }: { offerId: string; status: "DRAFT" | "SHARED" | "VIEWED" | "ACCEPTED" | "DECLINED" }) {
  const [state, action, pending] = useActionState(changeOfferStatus, initial);
  if (status === "ACCEPTED" || status === "DECLINED") return null;

  return (
    <form action={action} className="hub-offer-actions">
      <input type="hidden" name="offerId" value={offerId} />
      {status === "DRAFT" ? (
        <button
          type="submit"
          name="status"
          value="SHARED"
          className="hub-offer-decision-button"
          disabled={pending}
        >
          Mark as shared
        </button>
      ) : (
        <button
          type="submit"
          name="status"
          value="DRAFT"
          className="hub-offer-decision-button"
          disabled={pending}
        >
          Revise draft
        </button>
      )}
      {state.error && <p role="alert" className="hub-compose-error">{state.error}</p>}
      {state.success && <p role="status" className="hub-compose-success">Status updated.</p>}
    </form>
  );
}
