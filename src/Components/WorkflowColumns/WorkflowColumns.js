import React from "react"
import { workflowOptions } from "../../FormOptions"
import { WorkflowColumn } from "./WorkflowColumn"
import "./WorkflowColumn.css"

export const WorkflowColumns = ({
  tickets,
  searchTerm,
  onEditTicket,
  selectedWorkflow
}) => {
  return (
    <div className="container-tickets">
      {workflowOptions
        .filter((workflow) => selectedWorkflow.includes(workflow))
        .map((workflow) => (
          <WorkflowColumn
            key={workflow}
            workflow={workflow}
            tickets={tickets}
            searchTerm={searchTerm}
            onEditTicket={onEditTicket}
          />
        ))}
    </div>
  )
}
