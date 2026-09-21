import { Plus, X } from "lucide-react";

import { addMaterial, cycleMaterial, deleteMaterial } from "../actions";

type Material = {
  id: string;
  name: string;
  status: "AWAITING" | "RECEIVED" | "NOT_NEEDED";
};

type ProjectMaterialsProps = {
  projectId: string;
  materials: Material[];
};

const statusLabels: Record<Material["status"], string> = {
  AWAITING: "Awaiting",
  RECEIVED: "Received",
  NOT_NEEDED: "Not needed",
};

export default function ProjectMaterials({
  projectId,
  materials,
}: ProjectMaterialsProps) {
  return (
    <div className="hub-client-panel">
      <h2>
        Materials needed
        <span className="hub-project-panel-meta">From client</span>
      </h2>

      {materials.length === 0 ? (
        <p className="hub-client-empty">
          No materials requested yet.
        </p>
      ) : (
        <ul className="hub-material-list">
          {materials.map((material) => (
            <li key={material.id}>
              <span className="hub-material-name">{material.name}</span>

              <form action={cycleMaterial}>
                <input
                  type="hidden"
                  name="materialId"
                  value={material.id}
                />

                <button
                  type="submit"
                  className={`hub-material-status hub-material-status-${material.status.toLowerCase()}`}
                  title="Change status"
                >
                  {statusLabels[material.status]}
                </button>
              </form>

              <form action={deleteMaterial}>
                <input
                  type="hidden"
                  name="materialId"
                  value={material.id}
                />

                <button
                  type="submit"
                  className="hub-project-task-delete"
                  aria-label={`Remove ${material.name}`}
                >
                  <X size={14} />
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}

      <form action={addMaterial} className="hub-project-add-task">
        <input type="hidden" name="projectId" value={projectId} />

        <input
          name="name"
          placeholder="Add a material..."
          maxLength={200}
          required
          aria-label="Material name"
        />

        <button type="submit" aria-label="Add material">
          <Plus size={15} />
        </button>
      </form>
    </div>
  );
}
