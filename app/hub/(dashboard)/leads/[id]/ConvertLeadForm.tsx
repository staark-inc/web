"use client";

import { useActionState } from "react";
import {
  convertLeadToClient,
  type ConvertLeadState,
} from "../actions";

const initialState: ConvertLeadState = {
  error: null,
};

export default function ConvertLeadForm({
  leadId,
  defaultName,
}: {
  leadId: string;
  defaultName: string;
}) {
  const [state, formAction, pending] = useActionState(
    convertLeadToClient,
    initialState
  );

  return (
    <form action={formAction} className="hub-convert-form">
      <input type="hidden" name="leadId" value={leadId} />

      <label htmlFor="client-name">Client name</label>

      <div className="hub-convert-form-row">
        <input
          id="client-name"
          name="clientName"
          type="text"
          defaultValue={defaultName}
          placeholder="Company or client name"
          autoComplete="organization"
          minLength={2}
          maxLength={160}
          required
        />

        <button type="submit" disabled={pending}>
          {pending ? "Converting…" : "Convert to client"}
        </button>
      </div>

      {state.error && (
        <p role="alert" className="hub-convert-form-error">
          {state.error}
        </p>
      )}
    </form>
  );
}