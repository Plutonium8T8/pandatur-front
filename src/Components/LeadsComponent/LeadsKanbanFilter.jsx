import { Tabs, Button, Flex } from "@mantine/core";
import { getLanguageByKey } from "../utils";
import { TicketFormTabs } from "../TicketFormTabs";
import { MessageFilterForm } from "./MessageFilterForm";
import { useRef, useState } from "react";

export const LeadsKanbanFilter = ({
  onClose,
  loading,
  initialData,
  fetchKanbanTickets,
  setKanbanFilterActive,
  setKanbanFilters,
  setKanbanTickets,
}) => {
  const [activeTab, setActiveTab] = useState("filter_ticket");

  const ticketFormRef = useRef();
  const messageFormRef = useRef();

  const isEmpty = (v) =>
    v === undefined ||
    v === null ||
    v === "" ||
    (Array.isArray(v) && v.length === 0) ||
    (typeof v === "object" && Object.keys(v).length === 0);

  const mergeFilters = (...filters) =>
    Object.fromEntries(
      Object.entries(Object.assign({}, ...filters)).filter(
        ([_, v]) => !isEmpty(v)
      )
    );

  const handleReset = () => {
    setKanbanFilters({});
    setKanbanFilterActive(false);
    setKanbanTickets([]);
    onClose?.();
  };

  const handleSubmit = () => {
    console.log("[APLICĂ] Попытка сабмита всех форм");

    const ticketValues = ticketFormRef.current?.getValues?.() || {};
    const messageValues = messageFormRef.current?.getValues?.() || {};

    const combinedFilters = mergeFilters(ticketValues, messageValues);

    console.log("[APLICĂ] Собраны фильтры:", combinedFilters);

    if (Object.keys(combinedFilters).length === 0) {
      console.log("[APLICĂ] Фильтры пустые — сбрасываем");
      handleReset();
      return;
    }

    setKanbanFilterActive(true);
    setKanbanFilters(combinedFilters);
    fetchKanbanTickets(combinedFilters);
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
          ref={ticketFormRef}
          initialData={initialData}
          loading={loading}
        />
      </Tabs.Panel>

      <Tabs.Panel value="filter_message" pt="xs">
        <MessageFilterForm
          ref={messageFormRef}
          initialData={initialData}
          loading={loading}
        />
      </Tabs.Panel>

      <Flex justify="end" gap="md" mt="md">
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
