export const PREVIEW_SECTIONS = [
  {
    id: "dashboard",
    label: "Dashboard",
    group: "Workspace",
    description: "Metrics, charts, activity and attention",
  },
  {
    id: "collection",
    label: "CRM collection",
    group: "CRM",
    description: "Search, filters, table and mobile cards",
  },
  {
    id: "detail",
    label: "CRM detail",
    group: "CRM",
    description: "Entity header, timeline and side panels",
  },
  {
    id: "forms",
    label: "Forms",
    group: "System",
    description: "Fields, validation, dialog and success states",
  },
  {
    id: "settings",
    label: "Settings",
    group: "System",
    description: "Navigation, integrations and toggles",
  },
  {
    id: "shell",
    label: "Global shell",
    group: "System",
    description: "Sidebar, topbar, notifications and mobile nav",
  },
] as const;

export type PreviewSectionId = (typeof PREVIEW_SECTIONS)[number]["id"];

export function isPreviewSection(value: string | undefined): value is PreviewSectionId {
  return PREVIEW_SECTIONS.some((section) => section.id === value);
}

export function getPreviewSection(id: PreviewSectionId) {
  return PREVIEW_SECTIONS.find((section) => section.id === id) ?? PREVIEW_SECTIONS[0];
}
