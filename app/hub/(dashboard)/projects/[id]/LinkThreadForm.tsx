import { linkThread } from "../actions";

type LinkThreadFormProps = {
  projectId: string;
  currentThreadId: string | null;
  threads: { id: string; subject: string }[];
};

export default function LinkThreadForm({
  projectId,
  currentThreadId,
  threads,
}: LinkThreadFormProps) {
  if (threads.length === 0 && !currentThreadId) {
    return null;
  }

  return (
    <form action={linkThread} className="hub-project-link-thread">
      <input type="hidden" name="projectId" value={projectId} />

      <select
        name="threadId"
        defaultValue={currentThreadId ?? ""}
        aria-label="Link a conversation"
      >
        <option value="">No conversation</option>

        {threads.map((thread) => (
          <option key={thread.id} value={thread.id}>
            {thread.subject}
          </option>
        ))}
      </select>

      <button type="submit" className="hub-secondary-button">
        Link
      </button>
    </form>
  );
}
