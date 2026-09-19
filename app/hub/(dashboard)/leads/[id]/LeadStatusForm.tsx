type Props = {
  leadId: string;
  currentStatus:
    | "NEW"
    | "CONTACTED"
    | "QUALIFIED"
    | "WON"
    | "LOST";
};

export default function LeadStatusForm({
  leadId,
  currentStatus,
}: Props) {
  return (
    <form
      action={`/api/hub/leads/${leadId}/status`}
      method="post"
      className="hub-lead-status-form"
    >
      <select
        name="status"
        defaultValue={currentStatus}
        className="hub-lead-status-select"
        aria-label="Lead status"
      >
        <option value="NEW">New</option>
        <option value="CONTACTED">
          Contacted
        </option>
        <option value="QUALIFIED">
          Qualified
        </option>
        <option value="WON">Won</option>
        <option value="LOST">Lost</option>
      </select>

      <button
        type="submit"
        className="hub-lead-status-save"
      >
        Save
      </button>
    </form>
  );
}