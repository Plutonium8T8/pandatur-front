import { Tabs, Flex, Button, MultiSelect } from "@mantine/core"
import { useState, useEffect } from "react"
import { platformOptions } from "./utils"
import { SelectWorkflow } from "./components"
import { getLanguageByKey } from "../../utils"
import { filteredWorkflows } from "../LeadsTicketTabsFilter/utils"
import "./LeadsTicketTabsFilter.css"

export const LeadsTicketTabsFilter = ({
  onClose,
  onApplyWorkflowFilters,
  resetTicketsFilters,
  loading,
  formIds,
  renderTicketForms,
  systemWorkflow: baseSystemWorkflow
}) => {
  const [systemWorkflow, setSystemWorkflow] = useState(filteredWorkflows)

  const defaultTabValue = onApplyWorkflowFilters
    ? "filter_workflow"
    : "filter_ticket"

  useEffect(() => {
    setSystemWorkflow(baseSystemWorkflow)
  }, [])

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
              selectedValues={systemWorkflow}
              onChange={setSystemWorkflow}
            />

            <Flex justify="end" gap="md" mt="md">
              <Button
                variant="outline"
                onClick={() => setSystemWorkflow(filteredWorkflows)}
              >
                {getLanguageByKey("Reset filter")}
              </Button>
              <Button variant="default" onClick={onClose}>
                {getLanguageByKey("Închide")}
              </Button>
              <Button
                variant="filled"
                loading={loading}
                onClick={() => onApplyWorkflowFilters(systemWorkflow)}
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
