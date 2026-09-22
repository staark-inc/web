"use client";

import { Trash2 } from "lucide-react";
import { useState } from "react";

import { deleteOffer } from "./actions";

export default function OfferDeleteButton({
  offerId,
  disabled = false,
}: {
  offerId: string;
  disabled?: boolean;
}) {
  const [confirming, setConfirming] = useState(false);

  if (disabled) {
    return (
      <button
        type="button"
        className="hub-danger-button"
        disabled
        title="Offers linked to a project cannot be deleted."
      >
        <Trash2 size={15} />
        Delete offer
      </button>
    );
  }

  if (!confirming) {
    return (
      <button
        type="button"
        className="hub-danger-button"
        onClick={() => setConfirming(true)}
      >
        <Trash2 size={15} />
        Delete offer
      </button>
    );
  }

  return (
    <div className="hub-delete-confirm">
      <span>Delete this offer permanently?</span>

      <div className="hub-delete-confirm-actions">
        <form action={deleteOffer}>
          <input type="hidden" name="offerId" value={offerId} />
          <button type="submit" className="hub-danger-button">
            Yes, delete
          </button>
        </form>

        <button
          type="button"
          className="hub-secondary-button"
          onClick={() => setConfirming(false)}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
