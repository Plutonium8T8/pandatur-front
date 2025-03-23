import { workflowOptions } from "../../FormOptions"

export const VIEW_MODE = {
  KANBAN: "KANBAN",
  LIST: "LIST"
}

export const filteredWorkflows = workflowOptions.filter(
  (wf) => wf !== "Realizat cu succes" && wf !== "Închis și nerealizat"
)
