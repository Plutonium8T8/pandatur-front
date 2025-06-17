import { Tabs, Button, Flex } from "@mantine/core";
import { getLanguageByKey } from "../utils";
import { TicketFormTabs } from "../TicketFormTabs";
import { MessageFilterForm } from "./MessageFilterForm";
import { useApp } from "../../hooks";
import { useState } from "react";

export const LeadsKanbanFilter = ({ onClose, loading, initialData }) => {
  const {
    fetchKanbanTickets,
    setKanbanFilterActive,
    setKanbanFilters,
    setKanbanTickets,
  } = useApp();

  const [activeTab, setActiveTab] = useState("filter_ticket");

  const handleSubmit = () => {
    const form = document.querySelector("form");
    if (form) form.requestSubmit();
  };

  const handleReset = () => {
    setKanbanFilters({});
    setKanbanFilterActive(false);
    setKanbanTickets([]);
    onClose?.();
  };

  const handleFiltersSubmit = (filters) => {
    const hasValues = Object.values(filters).some(
      (v) => v !== undefined && v !== null && v !== "" && !(Array.isArray(v) && v.length === 0)
    );

    if (!hasValues) {
      handleReset();
      return;
    }

    setKanbanFilterActive(true);
    fetchKanbanTickets(filters);
    onClose?.();
  };

  return (
    <Tabs
      h="100%"
      className="leads-modal-filter-tabs"
      defaultValue="filter_ticket"
      value={activeTab}
      onChange={setActiveTab}
      pb="36px"
    >
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
          onSubmit={handleFiltersSubmit}
          loading={loading}
        />
      </Tabs.Panel>

      <Tabs.Panel value="filter_message" pt="xs">
        <MessageFilterForm
          initialData={initialData}
          loading={loading}
          onClose={onClose}
          onSubmit={handleFiltersSubmit}
        />
      </Tabs.Panel>

      <Flex justify="end" gap="md">
        <Button variant="outline" onClick={handleReset}>
          {getLanguageByKey("Reset filter")}
        </Button>
        <Button variant="default" onClick={onClose}>
          {getLanguageByKey("Închide")}
        </Button>
        <Button variant="filled" loading={loading} onClick={handleSubmit}>
          {getLanguageByKey("Aplică")}
        </Button>
      </Flex>
    </Tabs>
  );
};
