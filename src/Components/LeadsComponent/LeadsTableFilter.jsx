import { Tabs, Flex, Button, MultiSelect } from "@mantine/core";
import { getLanguageByKey } from "../utils";
import { TicketFormTabs } from "../TicketFormTabs";
import { platformOptions } from "./utils";

export const LeadsTableFilter = ({
  onClose,
  loading,
  initialData,
  onSubmitTicket,
}) => {
  return (
    <Tabs
      h="100%"
      className="leads-modal-filter-tabs"
      defaultValue="filter_ticket"
    >
      <Tabs.List>
        <Tabs.Tab value="filter_ticket">
          {getLanguageByKey("Filtru pentru Lead")}
        </Tabs.Tab>
        <Tabs.Tab value="filter_message">
          {getLanguageByKey("Filtru pentru mesaje (coming soon)")}
        </Tabs.Tab>
      </Tabs.List>

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
