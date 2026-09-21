import {
  ExternalLink,
  Play,
  RefreshCw,
  Square,
  Terminal,
} from "lucide-react";

import { getDemoStatus } from "@/lib/demo-manager";

import {
  deployProjectDemo,
  saveDemoConfig,
  startProjectDemo,
  stopProjectDemo,
} from "./demo-actions";
import ProjectDemoManagement from "./ProjectDemoManagement";

type Props = {
  projectId: string;

  demo: {
    slug: string;
    image: string;
    port: number;
    lastDeployedAt: Date | null;
  } | null;
};

function formatDate(date: Date | null) {
  if (!date) return "Never";

  return new Intl.DateTimeFormat("sv-SE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default async function ProjectDemo({
  projectId,
  demo,
}: Props) {
  let status:
    | "running"
    | "stopped"
    | "unknown" = "unknown";

  if (demo) {
    try {
      const response =
        await getDemoStatus(demo.slug);

      status =
        response.status === "running"
          ? "running"
          : "stopped";
    } catch {
      status = "stopped";
    }
  }

  const running =
    status === "running";

  const demoUrl = demo
    ? `https://demo.staark-app.cloud/${demo.slug}`
    : null;

    if (!demo) {
    return (
        <section className="hub-client-panel">
        <div className="hub-demo-header">
            <div>
            <div className="hub-demo-title-row">
                <h2>Demo environment</h2>
            </div>

            <p className="hub-client-empty">
                Configure a preview environment for this project.
            </p>
            </div>
        </div>

        <form
            action={saveDemoConfig.bind(null, projectId)}
            className="hub-demo-config-form"
        >
            <label>
            <span>Demo slug</span>

            <input
                name="slug"
                type="text"
                placeholder="alexdack"
                required
                pattern="[a-z0-9][a-z0-9-]{0,62}"
            />

            <small>
                Public URL:
                demo.staark-app.cloud/slug
            </small>
            </label>

            <label>
            <span>GHCR image</span>

            <input
                name="image"
                type="text"
                placeholder="ghcr.io/staark-inc/demo-alexdack:latest"
                required
            />
            </label>

            <label>
            <span>Internal port</span>

            <input
                name="port"
                type="number"
                defaultValue="3000"
                min="1"
                max="65535"
                required
            />
            </label>

            <div className="hub-demo-config-actions">
            <button
                type="submit"
                className="hub-primary-button"
            >
                Save demo configuration
            </button>
            </div>
        </form>
        </section>
    );
    }

  return (
    <div className="hub-demo-page">
      <section className="hub-client-panel">
        <div className="hub-demo-header">
          <div>
            <div className="hub-demo-title-row">
              <h2>Demo environment</h2>

              <span
                className={`hub-demo-status ${
                  running
                    ? "hub-demo-status-running"
                    : "hub-demo-status-stopped"
                }`}
              >
                <span />

                {running
                  ? "Running"
                  : "Stopped"}
              </span>
            </div>

            <p className="hub-client-empty">
              Preview environment for this
              project.
            </p>
          </div>

          {running && demoUrl && (
            <a
              href={demoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hub-secondary-button"
            >
              <ExternalLink size={14} />
              Open demo
            </a>
          )}
        </div>

        <div className="hub-demo-details">
          <div className="hub-demo-detail">
            <span>Public URL</span>

            <strong>
              {demoUrl ? (
                <a
                  href={demoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  demo.staark-app.cloud/
                  {demo.slug}
                </a>
              ) : (
                "—"
              )}
            </strong>
          </div>

          <div className="hub-demo-detail">
            <span>Slug</span>

            <code>{demo.slug}</code>
          </div>

          <div className="hub-demo-detail">
            <span>Container port</span>

            <code>{demo.port}</code>
          </div>

          <div className="hub-demo-detail">
            <span>Last deployment</span>

            <strong>
              {formatDate(
                demo.lastDeployedAt
              )}
            </strong>
          </div>
        </div>
      </section>

      <section className="hub-client-panel">
        <div className="hub-demo-section-head">
          <div>
            <h2>Deployment</h2>

            <p className="hub-client-empty">
              Current Docker image and
              deployment controls.
            </p>
          </div>
        </div>

        <div className="hub-demo-image">
          <div>
            <span>IMAGE</span>

            <code>{demo.image}</code>
          </div>

          <div>
            <span>STATUS</span>

            <strong
              className={
                running
                  ? "hub-demo-running-text"
                  : ""
              }
            >
              {running
                ? "Running"
                : "Stopped"}
            </strong>
          </div>
        </div>

        <div className="hub-demo-actions">
          <form
            action={deployProjectDemo.bind(
              null,
              projectId
            )}
          >
            <button
              type="submit"
              className="hub-primary-button"
            >
              <RefreshCw size={14} />

              {demo.lastDeployedAt
                ? "Redeploy"
                : "Deploy"}
            </button>
          </form>

          {running ? (
            <form
              action={stopProjectDemo.bind(
                null,
                projectId
              )}
            >
              <button
                type="submit"
                className="hub-demo-stop-button"
              >
                <Square size={13} />
                Stop
              </button>
            </form>
          ) : (
            <form
              action={startProjectDemo.bind(
                null,
                projectId
              )}
            >
              <button
                type="submit"
                className="hub-secondary-button"
              >
                <Play size={14} />
                Start
              </button>
            </form>
          )}

          <a
            href={`https://demo.staark-app.cloud/manage/${demo.slug}/logs`}
            target="_blank"
            rel="noopener noreferrer"
            className="hub-secondary-button"
          >
            <Terminal size={14} />
            Logs
          </a>
        </div>
      </section>
      <ProjectDemoManagement
        projectId={projectId}
        demo={demo}
      />

    </div>
  );
}