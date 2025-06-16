import { Tabs, Flex, Button } from "@mantine/core";
import { getLanguageByKey } from "../utils";
import { TicketFormTabs } from "../TicketFormTabs";
import { MessageFilterForm } from "./MessageFilterForm";
import { useState } from "react";

export const LeadsTableFilter = ({
  onClose,
  loading,
  initialData,
  onSubmitTicket,
  onResetFilters,
}) => {
  const [activeTab, setActiveTab] = useState("filter_ticket");

  const handleSubmit = () => {
    const form = document.querySelector("form");
    if (form) form.requestSubmit();
  };

  const handleReset = () => {
    onResetFilters?.();
    onClose?.();
  };

  return (
    <Tabs
      h="100%"
      className="leads-modal-filter-tabs"
      defaultValue="filter_ticket"
      value={activeTab}
      onChange={setActiveTab}
      pb="48"
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

      <Flex justify="end" gap="md" mt="md" pr="md">
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
