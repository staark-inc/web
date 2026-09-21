import Link from "next/link";
import { ArrowUpRight, Plus, X } from "lucide-react";

import { addTask, deleteTask, toggleTask } from "../actions";

type Task = {
  id: string;
  title: string;
  done: boolean;
};

type ProjectTasksProps = {
  projectId: string;
  tasks: Task[];

  /* Overview shows progress only; the Tasks tab manages them. */
  summary?: boolean;
};

export default function ProjectTasks({
  projectId,
  tasks,
  summary = false,
}: ProjectTasksProps) {
  const done = tasks.filter((task) => task.done).length;
  const next = tasks.find((task) => !task.done);
  const percent = tasks.length
    ? Math.round((done / tasks.length) * 100)
    : 0;

  return (
    <div className="hub-client-panel">
      <h2>
        Project tasks
        <span className="hub-project-panel-meta">
          {done} / {tasks.length} done
        </span>
      </h2>

      {next && (
        <div className="hub-project-next">
          <strong>
            <ArrowUpRight size={15} />
            Next action: {next.title}
          </strong>
        </div>
      )}

      {summary && (
        <>
          {tasks.length === 0 && (
            <p className="hub-client-empty">
              No tasks yet.
            </p>
          )}

          {tasks.length > 0 && (
            <div
              className="hub-project-progress"
              role="progressbar"
              aria-valuenow={percent}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <span style={{ width: `${percent}%` }} />
            </div>
          )}

          <Link
            href={`/hub/projects/${projectId}?tab=tasks`}
            className="hub-project-tasks-link"
          >
            Manage tasks
            <ArrowUpRight size={14} />
          </Link>
        </>
      )}

      {!summary && tasks.length > 0 && (
        <>
          <ul className="hub-project-tasks">
            {tasks.map((task) => (
              <li
                key={task.id}
                className={task.done ? "hub-project-task-done" : undefined}
              >
                <form action={toggleTask}>
                  <input type="hidden" name="taskId" value={task.id} />

                  <button
                    type="submit"
                    className="hub-project-task-toggle"
                    aria-label={
                      task.done ? "Mark as not done" : "Mark as done"
                    }
                  >
                    <span
                      className={`hub-project-checkbox ${
                        task.done ? "hub-project-checkbox-on" : ""
                      }`}
                    />
                  </button>
                </form>

                <span className="hub-project-task-title">{task.title}</span>

                {task.done ? (
                  <span className="hub-project-task-tag">Done</span>
                ) : (
                  task.id === next?.id && (
                    <span className="hub-project-task-tag">Next</span>
                  )
                )}

                <form action={deleteTask}>
                  <input type="hidden" name="taskId" value={task.id} />

                  <button
                    type="submit"
                    className="hub-project-task-delete"
                    aria-label={`Delete ${task.title}`}
                  >
                    <X size={14} />
                  </button>
                </form>
              </li>
            ))}
          </ul>

          <div
            className="hub-project-progress"
            role="progressbar"
            aria-valuenow={percent}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <span style={{ width: `${percent}%` }} />
          </div>
        </>
      )}

      {!summary && (
        <form action={addTask} className="hub-project-add-task">
          <input type="hidden" name="projectId" value={projectId} />

          <input
            name="title"
            placeholder="Add a task..."
            maxLength={300}
            required
            aria-label="Task title"
          />

          <button type="submit" aria-label="Add task">
            <Plus size={15} />
          </button>
        </form>
      )}
    </div>
  );
}
