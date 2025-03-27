import { workflowOptions } from "../../FormOptions/WorkFlowOption"

export const platformOptions = [
  "telegram",
  "viber",
  "whatsapp",
  "facebook",
  "instagram",
  "sipuni"
]

export const filteredWorkflows = workflowOptions.filter(
  (wf) => wf !== "Realizat cu succes" && wf !== "Închis și nerealizat"
)

export const filterDefaults = {
  workflow: filteredWorkflows,
  tags: []
}
