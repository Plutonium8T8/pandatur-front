import { Tabs } from "@mantine/core";
import { getLanguageByKey } from "../utils";
import { TicketFormTabs } from "../TicketFormTabs";
import { MessageFilterForm } from "./MessageFilterForm";
import { useApp } from "../../hooks";

export const LeadsKanbanFilter = ({ onClose, loading, initialData }) => {
  const { fetchKanbanTickets, setKanbanFilterActive } = useApp();

  const handleSubmit = (filters) => {
    setKanbanFilterActive(true);
    fetchKanbanTickets(filters);
    onClose?.();
  };

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
        <TicketFormTabs
          initialData={initialData}
          onClose={onClose}
          onSubmit={handleSubmit}
          loading={loading}
        />
      </Tabs.Panel>

      <Tabs.Panel value="filter_message" pt="xs">
        <MessageFilterForm
          initialData={initialData}
          loading={loading}
          onClose={onClose}
          onSubmit={handleSubmit}
        />
      </Tabs.Panel>
    </Tabs>
  );
};
