"use client";

import { useActionState } from "react";

import {
  createClient,
  updateClient,
  type UpdateClientState,
} from "./actions";

const initialState: UpdateClientState = {
  error: null,
  success: false,
};

type ClientFormProps = {
  client?: {
    id: string;
    name: string;
    billingEmail: string | null;
    phone: string | null;
    organizationNumber: string | null;
    billingAddress: string | null;
    notes: string | null;
  };

  /* Set when creating a client from a contact page. */
  contactId?: string;

  defaultName?: string;
  defaultEmail?: string;
};

export default function ClientForm({
  client,
  contactId,
  defaultName,
  defaultEmail,
}: ClientFormProps) {
  const [state, formAction, pending] = useActionState(
    client ? updateClient : createClient,
    initialState
  );

  return (
    <form action={formAction} className="hub-client-form">
      {client && (
        <input type="hidden" name="clientId" value={client.id} />
      )}

      {contactId && (
        <input type="hidden" name="contactId" value={contactId} />
      )}

      <div className="hub-client-form-grid">
        <div className="hub-client-form-field">
          <label htmlFor="client-name">Company name</label>
          <input
            id="client-name"
            name="name"
            defaultValue={client?.name ?? defaultName ?? ""}
            maxLength={160}
            required
            disabled={pending}
          />
        </div>

        <div className="hub-client-form-field">
          <label htmlFor="client-org">Organisation number</label>
          <input
            id="client-org"
            name="organizationNumber"
            defaultValue={client?.organizationNumber ?? ""}
            placeholder="559123-4567"
            disabled={pending}
          />
        </div>

        <div className="hub-client-form-field">
          <label htmlFor="client-email">Billing email</label>
          <input
            id="client-email"
            name="billingEmail"
            type="email"
            defaultValue={client?.billingEmail ?? defaultEmail ?? ""}
            placeholder="faktura@example.com"
            disabled={pending}
          />
        </div>

        <div className="hub-client-form-field">
          <label htmlFor="client-phone">Phone</label>
          <input
            id="client-phone"
            name="phone"
            defaultValue={client?.phone ?? ""}
            disabled={pending}
          />
        </div>
      </div>

      <div className="hub-client-form-field">
        <label htmlFor="client-address">Billing address</label>
        <textarea
          id="client-address"
          name="billingAddress"
          rows={2}
          defaultValue={client?.billingAddress ?? ""}
          disabled={pending}
        />
      </div>

      <div className="hub-client-form-field">
        <label htmlFor="client-notes">Notes</label>
        <textarea
          id="client-notes"
          name="notes"
          rows={4}
          defaultValue={client?.notes ?? ""}
          placeholder="Internal notes about this client..."
          disabled={pending}
        />
      </div>

      {state.error && (
        <div className="hub-compose-error">{state.error}</div>
      )}

      {state.success && !state.error && (
        <div className="hub-compose-success">Client saved.</div>
      )}

      <div className="hub-client-form-actions">
        <button
          type="submit"
          className="hub-send-button"
          disabled={pending}
        >
          {pending
            ? "Saving..."
            : client
              ? "Save changes"
              : "Create client"}
        </button>
      </div>
    </form>
  );
}
