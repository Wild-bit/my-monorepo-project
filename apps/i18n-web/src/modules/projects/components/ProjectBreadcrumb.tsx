import { useAppStore } from "@/stores";

export function ProjectBreadcrumb() {
  const { currentProject } = useAppStore();
  return <span className="text-sm font-medium text-slate-800">{currentProject?.name}</span>;
}