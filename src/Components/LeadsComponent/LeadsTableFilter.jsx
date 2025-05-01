import { Tabs, Flex, Button } from "@mantine/core";
import { getLanguageByKey } from "../utils";
import { TicketFormTabs } from "../TicketFormTabs";
import { MessageFilterForm } from "./MessageFilterForm";

export const LeadsTableFilter = ({
  onClose,
  loading,
  initialData,
  onSubmitTicket,
  onResetFilters,
}) => {
  return (
    <Tabs h="100%" className="leads-modal-filter-tabs" defaultValue="filter_ticket">
      <Tabs.List>
        <Tabs.Tab value="filter_ticket">
          {getLanguageByKey("Filtru pentru Lead")}
        </Tabs.Tab>
        <Tabs.Tab value="filter_message">
          {getLanguageByKey("Filtru dupǎ mesaje")}
        </Tabs.Tab>
      </Tabs.List>

      <Tabs.Panel value="filter_ticket" pt="xs">
        <Flex direction="column" justify="space-between" h="100%">
          <TicketFormTabs
            initialData={initialData}
            onClose={onClose}
            onSubmit={(filters) => onSubmitTicket(filters, "ticket")}
            loading={loading}
          />
          {/*TODO NEED FOR REFACTOR */}
          {/* <Flex justify="end" gap="md" mt="md">
            <Button
              variant="outline"
              onClick={() => {
                if (onResetFilters) onResetFilters();
              }}
            >
              {getLanguageByKey("Reset filter")}
            </Button>
            <Button variant="default" onClick={onClose}>
              {getLanguageByKey("Închide")}
            </Button>
            <Button
              variant="filled"
              loading={loading}
              onClick={() => onSubmitTicket(initialData, "ticket")}
            >
              {getLanguageByKey("Aplică")}
            </Button>
          </Flex> */}
        </Flex>
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
