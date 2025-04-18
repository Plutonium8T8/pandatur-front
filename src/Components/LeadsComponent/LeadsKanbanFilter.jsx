import { Tabs, Flex, Button, MultiSelect } from "@mantine/core";
import { useState, useEffect } from "react";
import { SelectWorkflow } from "../SelectWorkflow";
import { getLanguageByKey } from "../utils";
import { TicketFormTabs } from "../TicketFormTabs";
import { platformOptions, filteredWorkflows } from "./utils";

export const LeadsKanbanFilter = ({
  onClose,
  onApplyWorkflowFilters,
  loading,
  systemWorkflow: baseSystemWorkflow,
  initialData,
  onSubmitTicket,
}) => {
  const [systemWorkflow, setSystemWorkflow] = useState(filteredWorkflows);

  useEffect(() => {
    setSystemWorkflow(baseSystemWorkflow);
  }, []);

  return (
    <Tabs
      h="100%"
      className="leads-modal-filter-tabs"
      defaultValue="filter_workflow"
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
                {getLanguageByKey("Aplică")}
              </Button>
            </Flex>
          </Flex>
        </Tabs.Panel>
      )}

      <Tabs.Panel value="filter_ticket" pt="xs">
        <TicketFormTabs
          initialData={initialData}
          onClose={onClose}
          onSubmit={onSubmitTicket}
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
              {getLanguageByKey("Aplică")}
            </Button>
          </Flex>
        </Flex>
      </Tabs.Panel>
    </Tabs>
  );
};
