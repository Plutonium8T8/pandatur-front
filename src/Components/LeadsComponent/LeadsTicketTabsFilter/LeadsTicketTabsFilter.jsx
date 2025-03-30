import { Tabs, Flex, Button, MultiSelect } from "@mantine/core"
import React, { useState } from "react"
import { platformOptions, filteredWorkflows } from "./utils"
import { SelectWorkflow } from "./components"
import { getLanguageByKey } from "../../utils"
import "./LeadsTicketTabsFilter.css"

const systemFiltersInitialState = {
  workflow: filteredWorkflows
}

export const LeadsTicketTabsFilter = ({
  onClose,
  onApplyWorkflowFilters,
  resetTicketsFilters,
  loading,
  formIds,
  renderTicketForms
}) => {
  const [systemFilters, setSystemFilters] = useState(systemFiltersInitialState)

  const defaultTabValue = onApplyWorkflowFilters
    ? "filter_workflow"
    : "filter_ticket"

  return (
    <Tabs
      h="100%"
      className="leads-modal-filter-tabs"
      defaultValue={defaultTabValue}
    >
      <Tabs.List>
        {onApplyWorkflowFilters && (
          <Tabs.Tab value="filter_workflow">
            {getLanguageByKey("Filtru de sistem")}
          </Tabs.Tab>
        )}
        <Tabs.Tab value="filter_ticket">
          {getLanguageByKey("Filtru pentru Lead")}
        </Tabs.Tab>
        <Tabs.Tab value="filter_message">
          {getLanguageByKey("Filtru pentru mesaje (coming soon)")}
        </Tabs.Tab>
      </Tabs.List>

      {onApplyWorkflowFilters && (
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
      )}

      <Tabs.Panel value="filter_ticket" pt="xs">
        {renderTicketForms?.()}
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
