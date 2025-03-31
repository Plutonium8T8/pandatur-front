import React from "react"
import { Flex } from "@mantine/core"
import { workflowOptions } from "../../FormOptions"
import { WorkflowColumn } from "./components"

export const WorkflowColumns = ({
  tickets,
  searchTerm,
  onEditTicket,
  selectedWorkflow
}) => {
  return (
    <Flex gap="xs" w="100%" h="100%" className="overflow-x-scroll">
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
    </Flex>
  )
}
