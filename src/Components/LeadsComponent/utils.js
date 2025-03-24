import { workflowOptions } from "../../FormOptions"

export const VIEW_MODE = {
  KANBAN: "KANBAN",
  LIST: "LIST"
}

export const filteredWorkflows = workflowOptions.filter(
  (wf) => wf !== "Realizat cu succes" && wf !== "Închis și nerealizat"
)

export const formIDsKanban = {
  generalFormID: "generalFormIDKanban",
  ticketInfoFormID: "ticketInfoFormIDKanban",
  contractFormID: "contractFormIDKanban",
  invoiceFormID: "invoiceFormIDKanban",
  qualityControlFormID: "qualityControlFormIDKanban"
}

export const formIDsList = {
  generalFormID: "generalFormIDList",
  ticketInfoFormID: "ticketInfoFormIDList",
  contractFormID: "contractFormIDList",
  invoiceFormID: "invoiceFormIDList",
  qualityControlFormID: "qualityControlFormIDList"
}
