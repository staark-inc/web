import { Plus } from "lucide-react";

import { addNote } from "../actions";

type Activity = {
  id: string;
  kind: "NOTE" | "STATUS_CHANGED" | "TASK_COMPLETED" | "MATERIAL_RECEIVED";
  title: string;
  detail: string | null;
  createdAt: Date;
};

type ProjectActivityProps = {
  projectId: string;
  activities: Activity[];
};

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("sv-SE", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default function ProjectActivity({
  projectId,
  activities,
}: ProjectActivityProps) {
  return (
    <div className="hub-client-panel">
      <h2>
        Activity
        <span className="hub-project-panel-meta">Internal timeline</span>
      </h2>

      {activities.length === 0 ? (
        <p className="hub-client-empty">
          Status changes and completed work will appear here.
        </p>
      ) : (
        <ul className="hub-activity-list">
          {activities.map((activity) => (
            <li key={activity.id}>
              <span
                className={`hub-activity-dot hub-activity-dot-${activity.kind.toLowerCase()}`}
              />

              <div className="hub-activity-body">
                <strong>{activity.title}</strong>

                {activity.detail && <span>{activity.detail}</span>}

                <time dateTime={activity.createdAt.toISOString()}>
                  {formatDate(activity.createdAt)}
                </time>
              </div>
            </li>
          ))}
        </ul>
      )}

      <form action={addNote} className="hub-project-add-task">
        <input type="hidden" name="projectId" value={projectId} />

        <input
          name="title"
          placeholder="Add a note..."
          maxLength={300}
          required
          aria-label="Activity note"
        />

        <button type="submit" aria-label="Add note">
          <Plus size={15} />
        </button>
      </form>
    </div>
  );
}
