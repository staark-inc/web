import { Terminal } from "lucide-react";

import { getDemoLogs } from "@/lib/demo-manager";

import DemoDeleteButton from "./DemoDeleteButton";
import {
  deleteProjectDemo,
  updateDemoConfig,
} from "./demo-actions";

type Props = {
  projectId: string;

  demo: {
    slug: string;
    image: string;
    port: number;
  };
};

export default async function ProjectDemoManagement({
  projectId,
  demo,
}: Props) {
  let logs = "";
  let logsAvailable = true;

  try {
    const response =
      await getDemoLogs(demo.slug);

    logs =
      response.logs ||
      "No logs available.";
  } catch {
    logsAvailable = false;
  }

  return (
    <>
      <section className="hub-client-panel">
        <details className="hub-demo-config-details">
          <summary>Edit configuration</summary>

          <form
            action={updateDemoConfig.bind(
              null,
              projectId
            )}
            className="hub-demo-config-form hub-demo-config-form-edit"
          >
            <label>
              <span>Demo slug</span>

              <input
                name="slug"
                type="text"
                defaultValue={demo.slug}
                required
                pattern="[a-z0-9][a-z0-9-]{0,62}"
              />
            </label>

            <label>
              <span>GHCR image</span>

              <input
                name="image"
                type="text"
                defaultValue={demo.image}
                required
              />
            </label>

            <label>
              <span>Internal port</span>

              <input
                name="port"
                type="number"
                defaultValue={demo.port}
                min="1"
                max="65535"
                required
              />
            </label>

            <p className="hub-demo-config-note">
              Image and port changes take effect on the next
              redeploy. Changing the slug removes the old
              runtime container so it cannot be left orphaned.
            </p>

            <div className="hub-demo-config-actions">
              <button
                type="submit"
                className="hub-primary-button"
              >
                Save changes
              </button>
            </div>
          </form>
        </details>
      </section>

      <section className="hub-client-panel">
        <details className="hub-demo-logs">
          <summary>
            <span>
              <Terminal size={14} />
              Container logs
            </span>

            <small>
              {logsAvailable
                ? "Latest output"
                : "Unavailable"}
            </small>
          </summary>

          <pre>
            {logsAvailable
              ? logs
              : "Could not read logs from Demo Manager."}
          </pre>
        </details>
      </section>

      <section className="hub-client-panel hub-demo-danger-zone">
        <div>
          <h2>Danger zone</h2>

          <p className="hub-client-empty">
            Delete the demo container and remove its
            configuration from this project.
          </p>
        </div>

        <DemoDeleteButton
          slug={demo.slug}
          action={deleteProjectDemo.bind(
            null,
            projectId
          )}
        />
      </section>
    </>
  );
}
