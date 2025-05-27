import { Tabs, Flex } from "@mantine/core";
import { getLanguageByKey } from "../utils";
import { TicketFormTabs } from "../TicketFormTabs";
import { MessageFilterForm } from "./MessageFilterForm";

export const LeadsTableFilter = ({
  onClose,
  loading,
  initialData,
  onSubmitTicket,
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
            onSubmit={(filters) => onSubmitTicket(filters, "hard")}
            loading={loading}
          />
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
