import { Tabs, Flex, Button } from "@mantine/core";
import { useEffect, useState } from "react";
import { SelectWorkflow } from "../SelectWorkflow";
import { getLanguageByKey } from "../utils";
import { TicketFormTabs } from "../TicketFormTabs";
import { filteredWorkflows } from "./utils";
import { MessageFilterForm } from "./MessageFilterForm";

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
  }, [baseSystemWorkflow]);

  return (
    <Tabs h="100%" className="leads-modal-filter-tabs" defaultValue="filter_workflow">
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
          {getLanguageByKey("Filtru dupǎ mesaje")}
        </Tabs.Tab>
      </Tabs.List>

      {onApplyWorkflowFilters && (
        <Tabs.Panel value="filter_workflow" pt="xs">
          <Flex direction="column" justify="space-between" h="100%">
            <SelectWorkflow selectedValues={systemWorkflow} onChange={setSystemWorkflow} />
            <Flex justify="end" gap="md" mt="md">
              <Button variant="outline" onClick={() => onSubmitTicket({}, "message")}>
                {getLanguageByKey("Reset filter")}
              </Button>
              <Button variant="default" onClick={onClose}>
                {getLanguageByKey("Închide")}
              </Button>
              <Button variant="filled" loading={loading} onClick={() => onSubmitTicket({}, "message")}>
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
          onSubmit={(filters) => onSubmitTicket(filters, "ticket")}
          loading={loading}
        />
      </Tabs.Panel>

      <Tabs.Panel value="filter_message" pt="xs">
        <MessageFilterForm
          initialData={initialData}
          loading={loading}
          onClose={onClose}
          onSubmit={onSubmitTicket}
        />
      </Tabs.Panel>
    </Tabs>
  );
};
