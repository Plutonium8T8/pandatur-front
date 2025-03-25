import { Tabs, Flex, Button, MultiSelect } from "@mantine/core"
import React, { useState } from "react"
import { platformOptions, filteredWorkflows } from "./utils"
import { SelectWorkflow, TicketsFilter } from "./components"
import { getLanguageByKey, cleanFormValues } from "../utils"
import "./TicketFilterModal.css"

const systemFiltersInitialState = {
  workflow: filteredWorkflows
}

export const TicketFilterModal = ({
  onClose,
  onApplyWorkflowFilters,
  onApplyTicketFilters,
  resetTicketsFilters,
  loading,
  formIds
}) => {
  const [systemFilters, setSystemFilters] = useState(systemFiltersInitialState)

  return (
    <Tabs
      h="100%"
      className="leads-modal-filter-tabs"
      defaultValue="filter_workflow"
    >
      <Tabs.List>
        <Tabs.Tab value="filter_workflow">
          {getLanguageByKey("Filtru de sistem")}
        </Tabs.Tab>
        <Tabs.Tab value="filter_ticket">
          {getLanguageByKey("Filtru pentru Lead")}
        </Tabs.Tab>
        <Tabs.Tab value="filter_message">
          {getLanguageByKey("Filtru pentru mesaje (coming soon)")}
        </Tabs.Tab>
      </Tabs.List>

      <Tabs.Panel value="filter_workflow" pt="xs">
        <Flex direction="column" justify="space-between" h="100%">
          <SelectWorkflow
            selectedValues={systemFilters.workflow}
            onChange={(_, value) =>
              setSystemFilters({
                workflow: value
              })
            }
          />

          <Flex justify="end" gap="md" mt="md">
            <Button
              variant="outline"
              onClick={() => setSystemFilters(systemFiltersInitialState)}
            >
              {getLanguageByKey("Reset filter")}
            </Button>
            <Button variant="default" onClick={onClose}>
              {getLanguageByKey("Închide")}
            </Button>
            <Button
              variant="filled"
              loading={loading}
              onClick={() => onApplyWorkflowFilters(systemFilters)}
            >
              {getLanguageByKey("Trimite")}
            </Button>
          </Flex>
        </Flex>
      </Tabs.Panel>

      <Tabs.Panel value="filter_ticket" pt="xs">
        <TicketsFilter
          formIds={formIds}
          onClose={onClose}
          onSubmit={(values) => {
            onApplyTicketFilters(cleanFormValues(values))
          }}
          loading={loading}
        />
      </Tabs.Panel>

      <Tabs.Panel value="filter_message" pt="xs">
        <Flex direction="column" justify="space-between" h="100%">
          <MultiSelect
            searchable
            clearable
            label={getLanguageByKey("Platforma mesaj")}
            placeholder={getLanguageByKey("Platforma mesaj")}
            data={platformOptions}
          />

          <Flex justify="end" gap="md" mt="md">
            <Button variant="default" onClick={onClose}>
              {getLanguageByKey("Închide")}
            </Button>
            <Button disabled variant="filled">
              {getLanguageByKey("Trimite")}
            </Button>
          </Flex>
        </Flex>
      </Tabs.Panel>
    </Tabs>
  )
}
